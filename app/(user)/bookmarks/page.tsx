import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark as BookmarkIcon, Trash2 } from "lucide-react";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { removeBookmark } from "@/lib/actions/user";
import { cn, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "즐겨찾기" };
export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  answer: "답변",
  notice: "공지",
  schedule: "일정",
  source: "출처",
  question: "질문",
};

const TABS = [
  ["all", "전체"],
  ["answer", "답변"],
  ["notice", "공지"],
  ["schedule", "일정"],
  ["question", "질문"],
] as const;

export default async function BookmarksPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const user = await requireOnboardedUser();
  const type = searchParams.type && searchParams.type !== "all" ? searchParams.type : undefined;

  const bookmarks = await db.bookmark.findMany({
    where: { userId: user.id, ...(type ? { itemType: type } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  function linkFor(b: (typeof bookmarks)[number]): string | null {
    if (b.itemType === "notice") return `/notice/${b.itemId}`;
    if (b.itemType === "answer") return b.meta ?? null; // meta 에 대화 경로 저장
    if (b.itemType === "question") return `/chat?q=${encodeURIComponent(b.title)}`;
    if (b.itemType === "schedule") return "/calendar";
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold text-ink">즐겨찾기</h1>
        <p className="mt-1 text-sm text-body">
          저장한 답변, 공지, 일정과 질문을 모아 볼 수 있습니다.
        </p>
      </header>

      <nav aria-label="즐겨찾기 구분" className="flex gap-1.5 overflow-x-auto pb-1 thin-scroll">
        {TABS.map(([v, label]) => (
          <Link
            key={v}
            href={v === "all" ? "/bookmarks" : `/bookmarks?type=${v}`}
            className={cn(
              "shrink-0 rounded-md px-3.5 py-2 text-sm font-medium",
              (type ?? "all") === v ? "bg-ink text-white" : "bg-strong text-body hover:text-ink"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {bookmarks.length === 0 ? (
        <EmptyState
          icon={BookmarkIcon}
          title="저장된 항목이 없습니다"
          description="답변·공지·일정에서 북마크 아이콘을 눌러 저장해 보세요."
        />
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((b) => {
            const href = linkFor(b);
            const inner = (
              <>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="blue">{TYPE_LABELS[b.itemType] ?? b.itemType}</Badge>
                    {b.meta && b.itemType === "notice" && <Badge>{b.meta}</Badge>}
                  </div>
                  <p className="mt-1 truncate text-[15px] font-medium text-ink">{b.title}</p>
                  <p className="text-xs text-muted">{relativeTime(b.createdAt)} 저장</p>
                </div>
              </>
            );
            return (
              <li key={b.id} className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4">
                {href ? (
                  <Link href={href} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3">{inner}</div>
                )}
                <form action={removeBookmark.bind(null, b.id)}>
                  <button
                    type="submit"
                    aria-label="즐겨찾기에서 삭제"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-down/10 hover:text-down"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
