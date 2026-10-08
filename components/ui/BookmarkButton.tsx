"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleBookmark } from "@/lib/actions/user";
import { cn } from "@/lib/utils";

/** 낙관적 북마크 토글 버튼 */
export function BookmarkButton({
  itemType,
  itemId,
  title,
  meta,
  initial,
  size = 16,
  className,
}: {
  itemType: "answer" | "notice" | "schedule" | "source" | "question";
  itemId: string;
  title: string;
  meta?: string;
  initial: boolean;
  size?: number;
  className?: string;
}) {
  const [bookmarked, setBookmarked] = useState(initial);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      onClick={() => {
        setBookmarked((v) => !v); // 낙관적 처리
        startTransition(async () => {
          const res = await toggleBookmark({ itemType, itemId, title, meta });
          if (!res.ok) setBookmarked(initial);
          else setBookmarked(res.bookmarked);
        });
      }}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
        bookmarked ? "text-primary" : "text-muted hover:bg-soft hover:text-ink",
        className
      )}
    >
      <Bookmark size={size} fill={bookmarked ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}
