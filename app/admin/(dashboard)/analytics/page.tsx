import { db } from "@/lib/database/db";
import { HBars, TrendBars } from "@/components/admin/Charts";
import { tokenize } from "@/lib/ai/rag-service";
import { parseJson } from "@/lib/utils";
import type { SourceItem } from "@/types/chat";

export const dynamic = "force-dynamic";
export const metadata = { title: "통계" };

export default async function AdminAnalyticsPage() {
  const d30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [userMsgs, assistantMsgs, feedbacks] = await Promise.all([
    db.message.findMany({
      where: { role: "user", createdAt: { gte: d30 } },
      select: { content: true, createdAt: true },
    }),
    db.message.findMany({
      where: { role: "assistant", createdAt: { gte: d30 } },
      select: { sourcesJson: true, status: true },
    }),
    db.feedback.findMany({
      where: { createdAt: { gte: d30 } },
      select: { feedbackType: true, createdAt: true },
    }),
  ]);

  // 시간대별 사용량
  const hourly = Array.from({ length: 8 }, (_, i) => {
    const from = i * 3;
    const count = userMsgs.filter((m) => {
      const h = new Date(m.createdAt).getHours();
      return h >= from && h < from + 3;
    }).length;
    return { label: `${from}~${from + 3}시`, value: count };
  });

  // 자주 검색된 키워드
  const freq = new Map<string, number>();
  for (const m of userMsgs) {
    for (const t of tokenize(m.content)) {
      freq.set(t, (freq.get(t) ?? 0) + 1);
    }
  }
  const keywords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  // 출처 활용 비율
  const withSources = assistantMsgs.filter(
    (m) => parseJson<SourceItem[]>(m.sourcesJson, []).length > 0
  ).length;
  const sourceUsage = [
    { label: "출처 포함 답변", value: withSources },
    { label: "출처 없는 답변", value: assistantMsgs.length - withSources },
  ];

  // 주별 만족도 추이 (4주)
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const from = new Date(Date.now() - (4 - i) * 7 * 24 * 3600 * 1000);
    const to = new Date(from.getTime() + 7 * 24 * 3600 * 1000);
    const inWeek = feedbacks.filter((f) => f.createdAt >= from && f.createdAt < to);
    const helpful = inWeek.filter((f) => f.feedbackType === "helpful").length;
    return {
      label: `${from.getMonth() + 1}.${from.getDate()}~`,
      value: inWeek.length ? Math.round((helpful / inWeek.length) * 100) : 0,
    };
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-ink">통계</h1>
        <p className="mt-1 text-sm text-body">최근 30일 이용 데이터 기준입니다.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-hairline bg-surface p-5">
          <h2 className="font-semibold text-ink">시간대별 사용량</h2>
          <div className="mt-4">
            <TrendBars title="시간대별 사용량" data={hourly} />
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-surface p-5">
          <h2 className="font-semibold text-ink">주별 답변 만족도 (%)</h2>
          <div className="mt-4">
            <TrendBars title="주별 답변 만족도" data={weeks} />
          </div>
          <p className="mt-2 text-xs text-muted">
            피드백이 없는 주는 0으로 표시됩니다.
          </p>
        </section>

        <section className="rounded-lg border border-hairline bg-surface p-5">
          <h2 className="font-semibold text-ink">자주 검색된 키워드</h2>
          <div className="mt-5">
            {keywords.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">아직 질문 데이터가 없습니다.</p>
            ) : (
              <HBars title="자주 검색된 키워드" data={keywords} unit="회" />
            )}
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-surface p-5">
          <h2 className="font-semibold text-ink">정보 출처 활용 비율</h2>
          <div className="mt-5">
            {assistantMsgs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">아직 답변 데이터가 없습니다.</p>
            ) : (
              <HBars title="정보 출처 활용 비율" data={sourceUsage} />
            )}
          </div>
          <p className="mt-2 text-xs text-muted">
            출처 없는 답변 비율이 높으면 「대학 정보 데이터」 보강이 필요합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
