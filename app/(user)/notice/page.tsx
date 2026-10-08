import type { Metadata } from "next";
import Link from "next/link";
import { Pin } from "lucide-react";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { cn, ddayLabel, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "공지사항" };
export const dynamic = "force-dynamic";

export default async function NoticeListPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const user = await requireOnboardedUser();
  const category = searchParams.category;
  const q = (searchParams.q ?? "").trim().slice(0, 100);

  const [notices, categories, bookmarks] = await Promise.all([
    db.notice.findMany({
      where: {
        status: "published",
        ...(category ? { category } : {}),
        ...(q
          ? { OR: [{ title: { contains: q } }, { summary: { contains: q } }] }
          : {}),
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    db.notice.groupBy({
      by: ["category"],
      where: { status: "published" },
    }),
    db.bookmark.findMany({
      where: { userId: user.id, itemType: "notice" },
      select: { itemId: true },
    }),
  ]);
  const bookmarked = new Set(bookmarks.map((b) => b.itemId));

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold text-ink">공지사항</h1>
        <p className="mt-1.5 text-[0.9375rem] text-body">
          대학의 주요 공지를 확인하고 궁금한 점은 바로 질문하세요.
        </p>
      </header>

      <form action="/notice" method="get" role="search" className="flex gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <label htmlFor="q" className="sr-only">공지 검색</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="공지 제목·내용 검색"
          className="h-11 w-full max-w-md rounded-md border border-hairline bg-surface px-4 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-md bg-strong px-5 text-sm font-semibold text-ink hover:bg-hairline"
        >
          검색
        </button>
      </form>

      <nav aria-label="공지 카테고리" className="flex gap-1.5 overflow-x-auto pb-1 thin-scroll">
        <Link
          href={q ? `/notice?q=${encodeURIComponent(q)}` : "/notice"}
          aria-current={!category ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-md px-3.5 py-2 text-sm font-medium",
            !category ? "bg-ink text-white" : "bg-strong text-body hover:text-ink"
          )}
        >
          전체
        </Link>
        {categories.map((c) => (
          <Link
            key={c.category}
            href={`/notice?category=${encodeURIComponent(c.category)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            aria-current={category === c.category ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3.5 py-2 text-sm font-medium",
              category === c.category
                ? "bg-ink text-white"
                : "bg-strong text-body hover:text-ink"
            )}
          >
            {c.category}
          </Link>
        ))}
      </nav>

      {notices.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-surface p-12 text-center">
          <p className="font-semibold text-ink">등록된 공지가 없습니다</p>
          <p className="mt-1.5 text-sm text-body">다른 카테고리나 검색어를 시도해 보세요.</p>
        </div>
      ) : (
        <ul className="divide-y divide-hairline-soft rounded-lg border border-hairline bg-surface">
          {notices.map((n) => {
            const dday = ddayLabel(n.endAt);
            return (
              <li key={n.id} className="flex items-center gap-3 px-5 py-4">
                <Link href={`/notice/${n.id}`} className="group min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {n.isPinned && (
                      <Pin size={13} className="text-primary" aria-label="고정 공지" />
                    )}
                    <Badge>{n.category}</Badge>
                    <span className="text-xs text-muted">{n.department}</span>
                    <span className="text-xs text-muted">· {formatDate(n.createdAt)}</span>
                    {dday && dday !== "마감됨" && <Badge tone="amber">{dday}</Badge>}
                    {dday === "마감됨" && <Badge>마감됨</Badge>}
                  </div>
                  <p className="mt-1 text-[0.9375rem] font-medium text-ink group-hover:text-primary">
                    {n.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-body">{n.summary}</p>
                </Link>
                <BookmarkButton
                  itemType="notice"
                  itemId={n.id}
                  title={n.title}
                  meta={n.category}
                  initial={bookmarked.has(n.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
