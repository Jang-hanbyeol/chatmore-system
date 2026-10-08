import type { Metadata } from "next";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { StatusBadge } from "@/components/ui/Badge";
import { ReportForm } from "@/components/feedback/ReportForm";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "오류 신고·문의" };
export const dynamic = "force-dynamic";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: { messageId?: string };
}) {
  const user = await requireOnboardedUser();
  const reports = await db.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold text-ink">오류 신고·문의</h1>
        <p className="mt-1.5 text-[15px] text-body">
          잘못된 정보나 서비스 오류를 알려주시면 답변 품질 개선에 활용됩니다.
        </p>
      </header>

      <section className="rounded-lg border border-hairline bg-surface p-6">
        <ReportForm defaultMessageId={searchParams.messageId} />
      </section>

      <section aria-labelledby="my-reports" className="rounded-lg border border-hairline bg-surface">
        <header className="border-b border-hairline-soft px-5 py-4">
          <h2 id="my-reports" className="font-semibold text-ink">내 신고 내역</h2>
        </header>
        {reports.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            아직 접수한 신고가 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-xs text-muted">
                    {r.reportType} · {formatDateTime(r.createdAt)}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-ink">{r.content}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
