import type { Metadata } from "next";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/Badge";
import { addPersonalEvent, deletePersonalEvent } from "@/lib/actions/user";
import { cn, formatShortDate, kstParts, kstStartOfDay } from "@/lib/utils";
import { PersonalEventForm } from "@/components/calendar/PersonalEventForm";

export const metadata: Metadata = { title: "일정" };
export const dynamic = "force-dynamic";

const CAT_TONES: Record<string, "blue" | "green" | "amber" | "red" | "neutral"> = {
  학사: "blue",
  장학금: "amber",
  비교과: "green",
  등록: "red",
  행사: "neutral",
  기타: "neutral",
  개인: "neutral",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; category?: string };
}) {
  const user = await requireOnboardedUser();

  // 표시할 달 (기본: 이번 달, KST 기준). ?month=YYYY-MM 형식만 허용
  const today = kstParts();
  const match = /^(d{4})-(0[1-9]|1[0-2])$/.exec(searchParams.month ?? "");
  const year = match ? Number(match[1]) : today.year;
  const month = match ? Number(match[2]) - 1 : today.month - 1; // 0-based
  const monthStart = kstStartOfDay(year, month + 1, 1);
  const monthEnd = new Date(kstStartOfDay(year, month + 2, 1).getTime() - 1);
  const category = searchParams.category;

  const events = await db.scheduleEvent.findMany({
    where: {
      OR: [{ userId: null }, { userId: user.id }],
      ...(category ? { category } : {}),
      AND: [
        { startAt: { lte: monthEnd } },
        {
          OR: [
            { endAt: { gte: monthStart } },
            { endAt: null, startAt: { gte: monthStart } },
          ],
        },
      ],
    },
    orderBy: { startAt: "asc" },
  });

  // 달력 그리드 구성 (요일·일수는 달력 계산이라 UTC 날짜 연산으로 충분)
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const eventsOn = (day: number) => {
    const dayStart = kstStartOfDay(year, month + 1, day);
    const dayEnd = new Date(kstStartOfDay(year, month + 1, day + 1).getTime() - 1);
    return events.filter(
      (e) =>
        e.startAt <= dayEnd && (e.endAt ? e.endAt >= dayStart : e.startAt >= dayStart)
    );
  };

  const ym = (y: number, m0: number) => {
    const d = new Date(Date.UTC(y, m0, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const current = ym(year, month);
  const prev = ym(year, month - 1);
  const next = ym(year, month + 1);
  const isToday = (day: number) =>
    today.year === year && today.month === month + 1 && today.day === day;

  const categories = ["학사", "장학금", "비교과", "등록", "행사", "기타", "개인"];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">일정</h1>
          <p className="mt-1 text-sm text-body">
            학사·장학금·비교과 주요 일정을 확인하세요.
          </p>
        </div>
        <PersonalEventForm action={addPersonalEvent} />
      </header>

      {/* 카테고리 필터 */}
      <nav aria-label="일정 카테고리" className="flex gap-1.5 overflow-x-auto pb-1 thin-scroll">
        <Link
          href={`/calendar?month=${current}`}
          className={cn(
            "shrink-0 rounded-md px-3.5 py-1.5 text-sm font-medium",
            !category ? "bg-ink text-white" : "bg-strong text-body"
          )}
        >
          전체
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/calendar?month=${current}&category=${c}`}
            className={cn(
              "shrink-0 rounded-md px-3.5 py-1.5 text-sm font-medium",
              category === c ? "bg-ink text-white" : "bg-strong text-body"
            )}
          >
            {c}
          </Link>
        ))}
      </nav>

      {/* 월간 달력 */}
      <section aria-label="월간 달력" className="rounded-lg border border-hairline bg-surface">
        <header className="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
          <h2 className="font-semibold text-ink">
            {year}년 {month + 1}월
          </h2>
          <div className="flex gap-1">
            <Link
              href={`/calendar?month=${prev}${category ? `&category=${category}` : ""}`}
              aria-label="이전 달"
              className="flex h-9 w-9 items-center justify-center rounded-md text-body hover:bg-soft"
            >
              <ChevronLeft size={17} aria-hidden />
            </Link>
            <Link
              href={`/calendar?month=${next}${category ? `&category=${category}` : ""}`}
              aria-label="다음 달"
              className="flex h-9 w-9 items-center justify-center rounded-md text-body hover:bg-soft"
            >
              <ChevronRight size={17} aria-hidden />
            </Link>
          </div>
        </header>
        <div className="hidden grid-cols-7 border-b border-hairline-soft text-center text-xs font-semibold text-muted md:grid">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <span key={d} className="py-2">
              {d}
            </span>
          ))}
        </div>
        {/* 데스크톱: 그리드 / 모바일: 목록만 */}
        <div className="hidden grid-cols-7 md:grid">
          {cells.map((day, i) => (
            <div
              key={i}
              className={cn(
                "min-h-[92px] border-b border-r border-hairline-soft p-1.5 [&:nth-child(7n)]:border-r-0",
                day === null && "bg-soft/50"
              )}
            >
              {day !== null && (
                <>
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday(day) ? "bg-primary text-white" : "text-ink"
                    )}
                  >
                    {day}
                  </span>
                  <ul className="mt-0.5 space-y-0.5">
                    {eventsOn(day).slice(0, 3).map((e) => (
                      <li
                        key={e.id}
                        className={cn(
                          "truncate rounded-sm px-1.5 py-0.5 text-[0.625rem] font-medium leading-tight",
                          e.isDeadline
                            ? "bg-down/10 text-down"
                            : e.category === "개인"
                              ? "bg-strong text-ink"
                              : "bg-primary/10 text-primary"
                        )}
                        title={e.title}
                      >
                        {e.title}
                      </li>
                    ))}
                    {eventsOn(day).length > 3 && (
                      <li className="px-1.5 text-[0.625rem] text-muted">
                        +{eventsOn(day).length - 3}건
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 일정 목록 */}
      <section aria-label="일정 목록" className="rounded-lg border border-hairline bg-surface">
        <header className="border-b border-hairline-soft px-5 py-4">
          <h2 className="font-semibold text-ink">{month + 1}월 일정 목록</h2>
        </header>
        {events.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            이 달에 등록된 일정이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="w-16 shrink-0 text-center">
                  <span className="block font-mono text-sm font-bold text-ink">
                    {formatShortDate(e.startAt)}
                  </span>
                  {e.endAt && (
                    <span className="block text-[0.6875rem] text-muted">
                      ~{formatShortDate(e.endAt)}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] font-medium text-ink">
                    {e.title}
                  </span>
                  {e.department && (
                    <span className="text-xs text-muted">{e.department}</span>
                  )}
                </span>
                <Badge tone={CAT_TONES[e.category] ?? "neutral"}>{e.category}</Badge>
                {e.isDeadline && <Badge tone="red">마감</Badge>}
                {e.userId && (
                  <form action={deletePersonalEvent.bind(null, e.id)}>
                    <ConfirmSubmit
                      confirmMessage={`「${e.title}」 개인 일정을 삭제하시겠습니까?`}
                      ariaLabel={`${e.title} 개인 일정 삭제`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-down/10 hover:text-down disabled:opacity-50"
                    >
                      <Trash2 size={14} aria-hidden />
                    </ConfirmSubmit>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
