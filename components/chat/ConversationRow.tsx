"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark, Check, Pencil, Trash2, X } from "lucide-react";
import {
  deleteConversation,
  renameConversation,
  toggleConversationBookmark,
} from "@/lib/actions/chat";
import { Badge } from "@/components/ui/Badge";
import { cn, relativeTime } from "@/lib/utils";

export function ConversationRow({
  conversation,
}: {
  conversation: {
    id: string;
    title: string;
    category: string | null;
    isBookmarked: boolean;
    updatedAt: string;
    messageCount: number;
    lastQuestion: string;
  };
}) {
  const c = conversation;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(c.title);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <label htmlFor={`title-${c.id}`} className="sr-only">
              대화 제목
            </label>
            <input
              id={`title-${c.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 w-full rounded-md border border-hairline px-3 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              aria-label="제목 저장"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await renameConversation(c.id, title);
                  setEditing(false);
                })
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-white"
            >
              <Check size={15} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="취소"
              onClick={() => {
                setTitle(c.title);
                setEditing(false);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-strong text-ink"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        ) : (
          <Link href={`/chat/${c.id}`} className="group block">
            <div className="flex items-center gap-2">
              <span className="truncate text-[15px] font-semibold text-ink group-hover:text-primary">
                {title}
              </span>
              {c.category && <Badge tone="blue">{c.category}</Badge>}
            </div>
            <p className="mt-0.5 truncate text-sm text-body">
              {c.lastQuestion || "질문 없음"}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              메시지 {c.messageCount}개 · {relativeTime(c.updatedAt)}
            </p>
          </Link>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          aria-label={c.isBookmarked ? "즐겨찾기 해제" : "즐겨찾기"}
          onClick={() => startTransition(() => toggleConversationBookmark(c.id))}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md",
            c.isBookmarked ? "text-primary" : "text-muted hover:bg-soft hover:text-ink"
          )}
        >
          <Bookmark size={16} fill={c.isBookmarked ? "currentColor" : "none"} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="제목 변경"
          onClick={() => setEditing(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink"
        >
          <Pencil size={15} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="대화 삭제"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`「${title}」 대화를 삭제하시겠습니까?`)) {
              startTransition(() => deleteConversation(c.id));
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-down/10 hover:text-down"
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
    </div>
  );
}
