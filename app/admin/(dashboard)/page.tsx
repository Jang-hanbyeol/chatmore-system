import Link from "next/link";
import { db } from "@/lib/database/db";
import { StatusBadge } from "@/components/ui/Badge";
import { HBars, TrendBars } from "@/components/admin/Charts";
import { formatDateTime, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d14 = new Date(todayStart.getTime() - 13 * 24 * 3600 * 1000);
  const d7 = new Date(todayStart.getTime() - 7 * 24 * 3600 * 1000);

  const [
    todayQuestions,
    totalQuestions,
    activeUsers,
    helpful,
    notHelpful,
    reportCount,
    needsReviewData,
    recentMessages,
    recentNegative,
    recentReports,
    recentLogs,
    userMsgs14d,
    convCategories,
  ] = await Promise.all([
    db.message.count({ where: { role: "user", createdAt: { gte: todayStart } } }),
    db.message.count({ where: { role: "user" } }),
    db.user.count({ where: { status: "active", lastActiveAt: { gte: d7 } } }),
    db.feedback.count({ where: { feedbackType: "helpful" } }),
    db.feedback.count({ where: { feedbackType: "not_helpful" } }),
    db.report.count({ where: { status: { in: ["new", "reviewing"] } } }),
    db.informationSource.count({
      where: { dataStatus: { in: ["needs_review", "outdated", "sync_failed"] } },
    }),
    db.message.findMany({
      where: { role: "user" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.feedback.findMany({
      where: { feedbackType: "not_helpful" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { message: true },
    }),
    db.report.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    db.adminActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { admin: true },
    }),
    db.message.findMany({
      where: { role: "user", createdAt: { gte: d14 } },
      select: { createdAt: true },
    }),
    db.conversation.groupBy({ by: ["category"], _count: true }),
  ]);

  const satisfaction =
    helpful + notHelpful > 0
      ? Math.round((helpful / (helpful + notHelpful)) * 100)
      : null;

  // 일별 질문 추이 (14일)
  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(d14.getTime() + i * 24 * 3600 * 1000);
    const next = new Date(d.getTime() + 24 * 3600 * 1000);
    return {
      label: `${d.getMonth() + 1}.${d.getDate()}`,
      value: userMsgs14d.filter((m) => m.createdAt >= d && m.createdAt < next).length,
    };
  });

  const categoryShare = convCategories
    .map((c) => ({ label: c.category ?? "미분류", value: c._count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const stats: [string, string | number, string][] = [
    ["오늘 질문 수", todayQuestions, "/admin/questions"],
    ["누적 질문 수", totalQuestions, "/admin/questions"],
    ["주간 활성 사용자", activeUsers, "/admin/users"],
    ["답변 만족도", satisfaction === null ? "데이터 없음" : `${satisfaction}%`, "/admin/feedback"],
    ["부정 평가", notHelpful, "/admin/answers"],
    ["처리 대기 신고", reportCount, "/admin/reports"],
    ["업데이트 필요 데이터", needsReviewData, "/admin/data?status=needs_review"],
  ];

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">대시보드</h1>
          <p className="mt-1 text-sm text-body">
            질문·데이터·답변 품질 현황을 한눈에 확인하세요.
          </p>
        </div>
        {/* 빠른 작업 */}
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/data/new" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-active">
            대학 정보 추가
          </Link>
          <Link href="/admin/notices/new" className="rounded-md bg-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-hairline">
            공지 등록
          </Link>
          <Link href="/admin/reports" className="rounded-md bg-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-hairline">
            신고 확인
          </Link>
        </div>
      </header>

      {/* 통계 타일 */}
      <section aria-label="주요 지표" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {stats.map(([label, value, href]) => (
          <Link key={label} href={href} className="rounded-lg border border-hairline bg-surface p-4 transition-shadow hover:shadow-card">
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-1.5 font-mono text-xl font-semibold text-ink">{value}</p>
          </Link>
        ))}
      </section>

      <p className="rounded-md bg-strong px-4 py-2.5 text-xs text-muted">
        평균 응답 시간은 실제 AI 서버 연동 후 수집됩니다. 현재는 Mock 서비스 기준
        지표만 표시됩니다.
      </p>

      {/* 차트 */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-hairline bg-surface p-5">
          <h2 className="font-semibold text-ink">일별 질문 추이 (최근 14일)</h2>
          <div className="mt-4">
            <TrendBars title="일별 질문 추이" data={trend} />
          </div>
        </section>
        <section className="rounded-lg border border-hairline bg-surface p-5">
          <h2 className="font-semibold text-ink">카테고리별 질문 비율</h2>
          <div className="mt-5">
            {categoryShare.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">아직 질문 데이터가 없습니다.</p>
            ) : (
              <HBars title="카테고리별 질문 비율" data={categoryShare} />
            )}
          </div>
        </section>
      </div>

      {/* 최근 활동 */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-hairline bg-surface">
          <header className="flex items-center justify-between border-b border-hairline-soft px-5 py-3.5">
            <h2 className="font-semibold text-ink">최근 질문</h2>
            <Link href="/admin/questions" className="text-sm text-primary">전체 보기</Link>
          </header>
          {recentMessages.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">아직 질문이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-hairline-soft">
              {recentMessages.map((m) => (
                <li key={m.id} className="px-5 py-3">
                  <p className="truncate text-sm text-ink">“{m.content}”</p>
                  <p className="mt-0.5 text-xs text-muted">{formatDateTime(m.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-hairline bg-surface">
          <header className="flex items-center justify-between border-b border-hairline-soft px-5 py-3.5">
            <h2 className="font-semibold text-ink">부정 평가·신고</h2>
            <Link href="/admin/answers" className="text-sm text-primary">답변 품질 관리</Link>
          </header>
          <ul className="divide-y divide-hairline-soft">
            {recentNegative.length === 0 && recentReports.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted">
                접수된 부정 평가·신고가 없습니다.
              </li>
            )}
            {recentNegative.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    부정 평가 · {f.reason ?? "사유 미선택"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {truncate(f.message.content, 50)}
                  </p>
                </div>
                <StatusBadge status={f.status} />
              </li>
            ))}
            {recentReports.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">신고 · {r.reportType}</p>
                  <p className="truncate text-xs text-muted">{truncate(r.content, 50)}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-hairline bg-surface xl:col-span-2">
          <header className="border-b border-hairline-soft px-5 py-3.5">
            <h2 className="font-semibold text-ink">관리자 활동 기록</h2>
          </header>
          {recentLogs.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted">활동 기록이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-hairline-soft">
              {recentLogs.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="font-medium text-ink">{l.admin.name}</span>
                  <span className="text-body">
                    {l.resourceType} {l.action}
                  </span>
                  <span className="ml-auto text-xs text-muted">{formatDateTime(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
