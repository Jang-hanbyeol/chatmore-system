import { db } from "@/lib/database/db";
import { PendingButton } from "@/components/ui/PendingButton";
import { updateReportStatus } from "@/lib/actions/admin";
import { StatusBadge } from "@/components/ui/Badge";
import { inputCls } from "@/components/ui/Field";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "오류 신고 관리" };

const STATUSES = [
  ["new", "신규"],
  ["reviewing", "검토중"],
  ["resolved", "해결됨"],
  ["closed", "종료"],
] as const;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status;
  const reports = await db.report.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { userType: true, name: true } } },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-ink">오류 신고 관리</h1>
        <p className="mt-1 text-sm text-body">
          사용자가 접수한 정보 오류·서비스 오류·정보 요청을 처리합니다.
        </p>
      </header>

      <nav aria-label="상태 필터" className="flex flex-wrap gap-1.5">
        <a
          href="/admin/reports"
          className={!status ? "rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white" : "rounded-md bg-strong px-3 py-1.5 text-xs font-semibold text-body"}
        >
          전체
        </a>
        {STATUSES.map(([v, label]) => (
          <a
            key={v}
            href={`/admin/reports?status=${v}`}
            className={status === v ? "rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white" : "rounded-md bg-strong px-3 py-1.5 text-xs font-semibold text-body"}
          >
            {label}
          </a>
        ))}
      </nav>

      {reports.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-surface p-12 text-center text-muted">
          해당 상태의 신고가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <section key={r.id} className="rounded-lg border border-hairline bg-surface p-5" aria-label="신고 항목">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={r.status} />
                <span className="rounded-sm bg-strong px-2 py-0.5 text-xs font-semibold text-ink">
                  {r.reportType}
                </span>
                <span className="text-xs text-muted">
                  {r.user.name} ({r.user.userType}) · {formatDateTime(r.createdAt)}
                  {r.contactBack && " · 회신 요청"}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {r.content}
              </p>
              <form action={updateReportStatus} className="mt-4 flex flex-wrap items-end gap-3 border-t border-hairline-soft pt-4">
                <input type="hidden" name="id" value={r.id} />
                <label className="text-sm">
                  <span className="block text-xs font-semibold text-muted">처리 상태</span>
                  <select name="status" defaultValue={r.status} className={`${inputCls()} mt-1 h-10 w-40`}>
                    {STATUSES.map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-[220px] flex-1 text-sm">
                  <span className="block text-xs font-semibold text-muted">관리자 메모</span>
                  <input name="adminMemo" defaultValue={r.adminMemo ?? ""} className={`${inputCls()} mt-1 h-10`} />
                </label>
                <PendingButton className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-active disabled:opacity-60">
                  저장
                </PendingButton>
              </form>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
