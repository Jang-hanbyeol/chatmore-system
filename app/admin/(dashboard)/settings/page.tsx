import { db } from "@/lib/database/db";
import { requireAdmin } from "@/lib/auth/guards";
import { isRemoteConfigured } from "@/lib/ai/chat-service";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "시스템 설정" };

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const [counts, logs] = await Promise.all([
    Promise.all([
      db.user.count(),
      db.informationSource.count(),
      db.notice.count(),
      db.message.count(),
    ]),
    db.adminActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { admin: { select: { name: true } } },
    }),
  ]);
  const [userCount, sourceCount, noticeCount, messageCount] = counts;
  const remote = isRemoteConfigured();

  return (
    <div className="max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-ink">시스템 설정</h1>
        <p className="mt-1 text-sm text-body">서비스 구성과 연동 상태를 확인합니다.</p>
      </header>

      <section className="rounded-lg border border-hairline bg-surface p-6">
        <h2 className="font-semibold text-ink">AI·RAG 연동 상태</h2>
        <div className="mt-3 flex items-center gap-2">
          {remote ? (
            <Badge tone="green">원격 AI API 연결됨</Badge>
          ) : (
            <Badge tone="amber">Mock 서비스 (데모 응답)</Badge>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-body">
          {remote
            ? "CHATBOT_API_URL 로 설정된 외부 AI/RAG 서버가 답변을 생성합니다."
            : "실제 AI 서버가 설정되지 않아 Mock 서비스가 관리자 데이터 기반 데모 답변을 생성합니다. .env 의 CHATBOT_API_URL 을 설정하면 UI 수정 없이 실제 API 로 전환됩니다. (README 연동 가이드 참고)"}
        </p>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-6">
        <h2 className="font-semibold text-ink">시스템 현황</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          {[
            ["사용자", userCount],
            ["정보 데이터", sourceCount],
            ["공지", noticeCount],
            ["누적 메시지", messageCount],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-6">
        <h2 className="font-semibold text-ink">관리자 계정</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-xs text-muted">이름</dt>
            <dd className="text-ink">{admin.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">이메일</dt>
            <dd className="text-ink">{admin.email}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          비밀번호 변경·계정 추가는 시드 스크립트를 사용하세요 (README 「관리자
          계정 생성」).
        </p>
      </section>

      <section className="rounded-lg border border-hairline bg-surface">
        <header className="border-b border-hairline-soft px-5 py-4">
          <h2 className="font-semibold text-ink">관리자 활동 로그</h2>
        </header>
        {logs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">활동 기록이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span className="font-medium text-ink">{l.admin.name}</span>
                <span className="text-body">
                  {l.resourceType} {l.action}
                  {l.resourceId ? ` (#${l.resourceId.slice(-6)})` : ""}
                </span>
                <span className="ml-auto text-xs text-muted">{formatDateTime(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
