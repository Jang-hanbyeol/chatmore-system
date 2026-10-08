import { db } from "@/lib/database/db";
import { formatDateTime } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { parseJson } from "@/lib/utils";
import type { SourceItem } from "@/types/chat";

export const dynamic = "force-dynamic";
export const metadata = { title: "질문 분석" };

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const statusFilter = searchParams.status;

  // 최근 대화의 질문-답변 쌍 수집
  const conversations = await db.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 60,
    include: {
      user: { select: { userType: true, department: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  type Pair = {
    id: string;
    question: string;
    answerStatus: string;
    sourceCount: number;
    userType: string;
    category: string | null;
    createdAt: Date;
  };
  const pairs: Pair[] = [];
  for (const c of conversations) {
    for (let i = 0; i < c.messages.length; i++) {
      const m = c.messages[i];
      if (m.role !== "user") continue;
      const next = c.messages[i + 1];
      const answer = next?.role === "assistant" ? next : null;
      pairs.push({
        id: m.id,
        question: m.content,
        answerStatus: answer?.status ?? "no_answer",
        sourceCount: answer
          ? parseJson<SourceItem[]>(answer.sourcesJson, []).length
          : 0,
        userType: c.user.userType,
        category: c.category,
        createdAt: m.createdAt,
      });
    }
  }
  pairs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const filtered = pairs.filter(
    (p) =>
      (!q || p.question.includes(q)) &&
      (!statusFilter || p.answerStatus === statusFilter)
  );

  // 지표
  const total = pairs.length;
  const success = pairs.filter((p) => p.answerStatus === "success").length;
  const noResult = pairs.filter((p) => p.answerStatus === "no_result").length;
  const noSource = pairs.filter((p) => p.sourceCount === 0).length;

  const metrics: [string, string][] = [
    ["분석 대상 질문", `${total}건`],
    ["답변 성공률", total ? `${Math.round((success / total) * 100)}%` : "-"],
    ["출처 미검색 비율", total ? `${Math.round((noSource / total) * 100)}%` : "-"],
    ["미등록 정보 요청", `${noResult}건`],
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-ink">질문 분석</h1>
        <p className="mt-1 text-sm text-body">
          사용자 질문과 답변 상태를 분석해 데이터 보강 우선순위를 파악합니다.
        </p>
      </header>

      <section aria-label="주요 지표" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-hairline bg-surface p-4">
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-1.5 font-mono text-xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <form action="/admin/questions" method="get" role="search" className="flex gap-2">
          <label htmlFor="q" className="sr-only">질문 검색</label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="질문 내용 검색"
            className="h-10 w-64 rounded-md border border-hairline bg-surface px-3.5 text-sm focus:border-primary focus:outline-none"
          />
          <button type="submit" className="h-10 rounded-md bg-strong px-4 text-sm font-semibold text-ink">
            검색
          </button>
        </form>
        <nav aria-label="답변 상태 필터" className="flex gap-1.5">
          {[
            ["", "전체"],
            ["success", "성공"],
            ["partial", "부분"],
            ["no_result", "결과 없음"],
            ["error", "오류"],
          ].map(([v, label]) => (
            <a
              key={v}
              href={v ? `/admin/questions?status=${v}` : "/admin/questions"}
              className={
                (statusFilter ?? "") === v
                  ? "rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-md bg-strong px-3 py-1.5 text-xs font-semibold text-body"
              }
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-muted">
              <th className="px-4 py-3 font-semibold">질문</th>
              <th className="px-3 py-3 font-semibold">카테고리</th>
              <th className="px-3 py-3 font-semibold">사용자 유형</th>
              <th className="px-3 py-3 font-semibold">답변 상태</th>
              <th className="px-3 py-3 font-semibold">출처</th>
              <th className="px-3 py-3 font-semibold">질문 시간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  조건에 맞는 질문이 없습니다.
                </td>
              </tr>
            )}
            {filtered.slice(0, 80).map((p) => (
              <tr key={p.id}>
                <td className="max-w-[320px] px-4 py-3">
                  <p className="truncate text-ink">“{p.question}”</p>
                </td>
                <td className="px-3 py-3">
                  {p.category ? <Badge tone="blue">{p.category}</Badge> : <span className="text-muted">-</span>}
                </td>
                <td className="px-3 py-3 text-body">{p.userType}</td>
                <td className="px-3 py-3">
                  {p.answerStatus === "success" && <Badge tone="green">성공</Badge>}
                  {p.answerStatus === "partial" && <Badge tone="amber">부분</Badge>}
                  {p.answerStatus === "no_result" && <Badge tone="red">결과 없음</Badge>}
                  {p.answerStatus === "error" && <StatusBadge status="sync_failed" />}
                  {p.answerStatus === "no_answer" && <Badge>미응답</Badge>}
                </td>
                <td className="px-3 py-3 font-mono text-body">{p.sourceCount}</td>
                <td className="px-3 py-3 text-body">{formatDateTime(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        개인정보 보호를 위해 질문 저장 시 이메일·전화번호 등 민감정보 패턴은
        자동 마스킹됩니다. 결과 없음 비율이 높은 주제는 「대학 정보 데이터」에서
        보강해 주세요.
      </p>
    </div>
  );
}
