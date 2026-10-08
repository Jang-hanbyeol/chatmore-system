import { db } from "@/lib/database/db";
import { PendingButton } from "@/components/ui/PendingButton";
import { updateFeedbackStatus } from "@/lib/actions/admin";
import { StatusBadge } from "@/components/ui/Badge";
import { inputCls } from "@/components/ui/Field";
import { FEEDBACK_STATUSES } from "@/lib/validation/schemas";
import { FEEDBACK_STATUS_LABELS, formatDateTime, parseJson, truncate } from "@/lib/utils";
import type { SourceItem } from "@/types/chat";

export const dynamic = "force-dynamic";
export const metadata = { title: "답변 품질 관리" };

export default async function AdminAnswersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status;
  const feedbacks = await db.feedback.findMany({
    where: {
      feedbackType: "not_helpful",
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      message: {
        include: {
          conversation: {
            include: { messages: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
      user: { select: { userType: true } },
    },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-ink">답변 품질 관리</h1>
        <p className="mt-1 text-sm text-body">
          부정 평가된 답변을 검토하고 관련 데이터를 개선합니다. AI 답변을 대화
          기록에 소급 수정하는 기능은 데이터 정책 확정 전까지 제공하지 않습니다.
        </p>
      </header>

      <nav aria-label="검토 상태 필터" className="flex flex-wrap gap-1.5">
        <a
          href="/admin/answers"
          className={!status ? "rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white" : "rounded-md bg-strong px-3 py-1.5 text-xs font-semibold text-body"}
        >
          전체
        </a>
        {FEEDBACK_STATUSES.map((s) => (
          <a
            key={s}
            href={`/admin/answers?status=${s}`}
            className={status === s ? "rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white" : "rounded-md bg-strong px-3 py-1.5 text-xs font-semibold text-body"}
          >
            {FEEDBACK_STATUS_LABELS[s]}
          </a>
        ))}
      </nav>

      {feedbacks.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-surface p-12 text-center text-muted">
          해당 상태의 부정 평가가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((f) => {
            const msgs = f.message.conversation.messages;
            const idx = msgs.findIndex((m) => m.id === f.messageId);
            const question = idx > 0 ? msgs[idx - 1].content : "(질문 확인 불가)";
            const sources = parseJson<SourceItem[]>(f.message.sourcesJson, []);
            return (
              <section key={f.id} className="rounded-lg border border-hairline bg-surface p-5" aria-label="부정 평가 항목">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={f.status} />
                  <span className="text-xs text-muted">
                    {f.user.userType} · {formatDateTime(f.createdAt)}
                  </span>
                  {f.reason && (
                    <span className="rounded-sm bg-down/10 px-2 py-0.5 text-xs font-semibold text-down">
                      {f.reason}
                    </span>
                  )}
                </div>

                <dl className="mt-3 space-y-2.5 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-muted">질문</dt>
                    <dd className="mt-0.5 text-ink">“{question}”</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted">AI 답변</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap rounded-md bg-soft px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-body">
                      {truncate(f.message.content, 400)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted">사용 출처</dt>
                    <dd className="mt-0.5 text-body">
                      {sources.length === 0
                        ? "출처 없음 (데이터 보강 필요 가능성)"
                        : sources.map((s) => s.title).join(" · ")}
                    </dd>
                  </div>
                </dl>

                <form action={updateFeedbackStatus} className="mt-4 flex flex-wrap items-end gap-3 border-t border-hairline-soft pt-4">
                  <input type="hidden" name="id" value={f.id} />
                  <label className="text-sm">
                    <span className="block text-xs font-semibold text-muted">검토 상태</span>
                    <select name="status" defaultValue={f.status} className={`${inputCls()} mt-1 h-10 w-52`}>
                      {FEEDBACK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {FEEDBACK_STATUS_LABELS[s]} ({s})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="block text-xs font-semibold text-muted">담당자</span>
                    <input name="assignee" defaultValue={f.assignee ?? ""} placeholder="담당자명" className={`${inputCls()} mt-1 h-10 w-36`} />
                  </label>
                  <label className="min-w-[220px] flex-1 text-sm">
                    <span className="block text-xs font-semibold text-muted">관리자 메모</span>
                    <input name="adminMemo" defaultValue={f.adminMemo ?? ""} placeholder="처리 내용 기록" className={`${inputCls()} mt-1 h-10`} />
                  </label>
                  <PendingButton className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-active disabled:opacity-60">
                    저장
                  </PendingButton>
                  <a
                    href="/admin/data"
                    className="h-10 rounded-md bg-strong px-4 text-sm font-semibold leading-10 text-ink hover:bg-hairline"
                  >
                    데이터 수정
                  </a>
                </form>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
