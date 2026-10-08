import { db } from "@/lib/database/db";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatDateTime, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "사용자 피드백" };

export default async function AdminFeedbackPage() {
  const [helpful, notHelpful, feedbacks] = await Promise.all([
    db.feedback.count({ where: { feedbackType: "helpful" } }),
    db.feedback.count({ where: { feedbackType: "not_helpful" } }),
    db.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        message: { select: { content: true } },
        user: { select: { userType: true } },
      },
    }),
  ]);
  const total = helpful + notHelpful;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-ink">사용자 피드백</h1>
        <p className="mt-1 text-sm text-body">답변 평가 전체 내역입니다.</p>
      </header>

      <section aria-label="피드백 요약" className="grid grid-cols-3 gap-3">
        {[
          ["유용해요", helpful, "text-up"],
          ["도움 안 됨", notHelpful, "text-down"],
          ["만족도", total ? `${Math.round((helpful / total) * 100)}%` : "-", "text-ink"],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="rounded-lg border border-hairline bg-surface p-4">
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className={`mt-1.5 font-mono text-xl font-semibold ${cls}`}>{value as string}</p>
          </div>
        ))}
      </section>

      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-muted">
              <th className="px-4 py-3 font-semibold">평가</th>
              <th className="px-3 py-3 font-semibold">답변 내용</th>
              <th className="px-3 py-3 font-semibold">사유</th>
              <th className="px-3 py-3 font-semibold">사용자</th>
              <th className="px-3 py-3 font-semibold">상태</th>
              <th className="px-3 py-3 font-semibold">일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {feedbacks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  수집된 피드백이 없습니다.
                </td>
              </tr>
            )}
            {feedbacks.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3">
                  {f.feedbackType === "helpful" ? (
                    <Badge tone="green">유용해요</Badge>
                  ) : (
                    <Badge tone="red">도움 안 됨</Badge>
                  )}
                </td>
                <td className="max-w-[280px] px-3 py-3 text-body">
                  {truncate(f.message.content, 60)}
                </td>
                <td className="px-3 py-3 text-body">{f.reason ?? "-"}</td>
                <td className="px-3 py-3 text-body">{f.user.userType}</td>
                <td className="px-3 py-3"><StatusBadge status={f.status} /></td>
                <td className="px-3 py-3 text-body">{formatDateTime(f.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
