import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MessageCircleMore,
  Pin,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { ddayLabel, formatShortDate, kstToday, relativeTime } from "@/lib/utils";
import { QuickAsk } from "@/components/chat/QuickAsk";

export const metadata: Metadata = { title: "홈" };
export const dynamic = "force-dynamic";

const QUICK_QUESTIONS = [
  "이번 달 학사일정",
  "신청 가능한 장학금",
  "비교과 프로그램",
  "복학 신청 방법",
  "도서관 운영시간",
  "통학버스 시간표",
];

export default async function HomePage() {
  const user = await requireOnboardedUser();
  // 맞춤 추천 동의 시에만 관심 분야로 추천 (미동의: 최신 정보)
  const interests =
    user.allowPersonalization && user.interests ? user.interests.split(",") : [];

  const [notices, events, conversations, recommended, bookmarks] =
    await Promise.all([
      db.notice.findMany({
        where: { status: "published" },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
      db.scheduleEvent.findMany({
        where: {
          OR: [{ userId: null }, { userId: user.id }],
          startAt: { gte: kstToday() }, // 오늘(KST) 일정부터
        },
        orderBy: { startAt: "asc" },
        take: 5,
      }),
      db.conversation.findMany({
        where: { userId: user.id, isEphemeral: false },
        orderBy: { updatedAt: "desc" },
        take: 3,
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      db.informationSource.findMany({
        where: {
          dataStatus: "active",
          ...(interests.length > 0
            ? {
                OR: interests.map((i) => ({
                  OR: [
                    { category: { contains: i } },
                    { keywords: { contains: i } },
                    { title: { contains: i } },
                  ],
                })),
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      db.bookmark.findMany({
        where: { userId: user.id, itemType: "notice" },
        select: { itemId: true },
      }),
    ]);
  const bookmarkedNoticeIds = new Set(bookmarks.map((b) => b.itemId));

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      {/* 환영 + 빠른 질문 */}
      <section aria-labelledby="welcome">
        <h1 id="welcome" className="text-2xl font-semibold text-ink md:text-3xl">
          안녕하세요, {user.name}님.
        </h1>
        <p className="mt-1.5 text-[0.9375rem] text-body">
          오늘 필요한 대학 정보를 확인해 보세요.
        </p>
        <div className="mt-5">
          <QuickAsk quickQuestions={QUICK_QUESTIONS} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 맞춤 추천 */}
        <section
          aria-labelledby="recommend"
          className="rounded-lg border border-hairline bg-surface"
        >
          <header className="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
            <h2 id="recommend" className="flex items-center gap-2 font-semibold text-ink">
              <Sparkles size={16} className="text-primary" aria-hidden /> 맞춤 추천
            </h2>
            <Link href="/explore" className="flex items-center gap-1 text-sm text-primary">
              정보 탐색 <ArrowRight size={14} aria-hidden />
            </Link>
          </header>
          <div className="p-5">
            <p className="mb-3 text-xs text-muted">
              설정한 관심 분야를 기준으로 추천된 정보입니다.
            </p>
            {recommended.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                추천할 정보가 아직 없습니다. 설정에서 관심 분야를 선택해 보세요.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {recommended.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/chat?q=${encodeURIComponent(`${r.title}에 대해 알려줘`)}`}
                      className="block rounded-md border border-hairline px-4 py-3 hover:border-primary"
                    >
                      <div className="flex items-center gap-2">
                        <Badge tone="blue">{r.category}</Badge>
                        {r.endAt && ddayLabel(r.endAt) && (
                          <Badge tone={ddayLabel(r.endAt) === "마감됨" ? "neutral" : "amber"}>
                            {ddayLabel(r.endAt)}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-ink">{r.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-body">{r.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 중요 일정 */}
        <section
          aria-labelledby="schedule"
          className="rounded-lg border border-hairline bg-surface"
        >
          <header className="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
            <h2 id="schedule" className="flex items-center gap-2 font-semibold text-ink">
              <CalendarDays size={16} className="text-primary" aria-hidden /> 다가오는 일정
            </h2>
            <Link href="/calendar" className="flex items-center gap-1 text-sm text-primary">
              전체 일정 <ArrowRight size={14} aria-hidden />
            </Link>
          </header>
          <ul className="divide-y divide-hairline-soft">
            {events.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted">
                다가오는 일정이 없습니다.
              </li>
            )}
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="w-14 shrink-0 text-center">
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
                  <span className="block truncate text-sm font-medium text-ink">
                    {e.title}
                  </span>
                  <span className="text-xs text-muted">{e.category}</span>
                </span>
                {e.isDeadline && <Badge tone="red">마감</Badge>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 주요 공지 */}
      <section aria-labelledby="notices" className="rounded-lg border border-hairline bg-surface">
        <header className="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
          <h2 id="notices" className="font-semibold text-ink">주요 공지</h2>
          <Link href="/notice" className="flex items-center gap-1 text-sm text-primary">
            전체 공지 <ArrowRight size={14} aria-hidden />
          </Link>
        </header>
        <ul className="divide-y divide-hairline-soft">
          {notices.map((n) => (
            <li key={n.id} className="flex items-center gap-3 px-5 py-3.5">
              <Link href={`/notice/${n.id}`} className="group min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {n.isPinned && (
                    <Pin size={13} className="shrink-0 text-primary" aria-label="고정 공지" />
                  )}
                  <Badge>{n.category}</Badge>
                  <span className="text-xs text-muted">{n.department}</span>
                  {n.endAt && ddayLabel(n.endAt) && ddayLabel(n.endAt) !== "마감됨" && (
                    <Badge tone="amber">{ddayLabel(n.endAt)}</Badge>
                  )}
                </div>
                <p className="mt-1 truncate text-[0.9375rem] font-medium text-ink group-hover:text-primary">
                  {n.title}
                </p>
              </Link>
              <BookmarkButton
                itemType="notice"
                itemId={n.id}
                title={n.title}
                meta={n.category}
                initial={bookmarkedNoticeIds.has(n.id)}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* 최근 대화 */}
      <section aria-labelledby="recent" className="rounded-lg border border-hairline bg-surface">
        <header className="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
          <h2 id="recent" className="flex items-center gap-2 font-semibold text-ink">
            <MessageCircleMore size={16} className="text-primary" aria-hidden /> 최근 대화
          </h2>
          <Link href="/history" className="flex items-center gap-1 text-sm text-primary">
            대화 기록 <ArrowRight size={14} aria-hidden />
          </Link>
        </header>
        {conversations.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted">아직 저장된 대화가 없습니다.</p>
            <Link
              href="/chat"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-active"
            >
              Chatmore에게 질문하기
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className="group flex items-center gap-4 px-5 py-3.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem] font-medium text-ink group-hover:text-primary">
                      {c.title}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {c.messages[0]?.content ?? ""} · {relativeTime(c.updatedAt)}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-primary">계속하기</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
