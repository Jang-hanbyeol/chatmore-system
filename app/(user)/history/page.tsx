import type { Metadata } from "next";
import Link from "next/link";
import { History as HistoryIcon } from "lucide-react";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConversationRow } from "@/components/chat/ConversationRow";
import { deleteAllConversations } from "@/lib/actions/chat";
import { cn } from "@/lib/utils";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";

export const metadata: Metadata = { title: "대화 기록" };
export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { q?: string; filter?: string };
}) {
  const user = await requireOnboardedUser();
  const q = (searchParams.q ?? "").trim().slice(0, 100);
  const filter = searchParams.filter;

  const conversations = await db.conversation.findMany({
    where: {
      userId: user.id,
      isEphemeral: false, // '대화 기록 저장' 끈 상태의 대화는 목록에 표시하지 않음
      ...(filter === "bookmarked" ? { isBookmarked: true } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { messages: { some: { content: { contains: q } } } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: {
        where: { role: "user" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">대화 기록</h1>
          <p className="mt-1 text-sm text-body">총 {conversations.length}개의 대화</p>
        </div>
        {conversations.length > 0 && (
          <form action={deleteAllConversations}>
            <ConfirmSubmit
              confirmMessage="모든 대화 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
              className="rounded-md px-3.5 py-2 text-sm font-semibold text-down hover:bg-down/10"
            >
              전체 삭제
            </ConfirmSubmit>
          </form>
        )}
      </header>

      {!user.saveHistory && (
        <p className="rounded-md border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
          대화 기록 저장이 꺼져 있습니다. 설정에서 다시 켤 수 있습니다.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <form action="/history" method="get" role="search" className="flex flex-1 gap-2">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <label htmlFor="q" className="sr-only">대화 검색</label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="대화 제목·내용 검색"
            className="h-11 w-full rounded-md border border-hairline bg-surface px-4 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-md bg-strong px-4 text-sm font-semibold text-ink hover:bg-hairline"
          >
            검색
          </button>
        </form>
        <nav aria-label="필터" className="flex gap-1.5">
          <Link
            href={q ? `/history?q=${encodeURIComponent(q)}` : "/history"}
            aria-current={!filter ? "page" : undefined}
            className={cn(
              "rounded-md px-3.5 py-2 text-sm font-medium",
              !filter ? "bg-ink text-white" : "bg-strong text-body"
            )}
          >
            전체
          </Link>
          <Link
            href={`/history?filter=bookmarked${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            aria-current={filter === "bookmarked" ? "page" : undefined}
            className={cn(
              "rounded-md px-3.5 py-2 text-sm font-medium",
              filter === "bookmarked" ? "bg-ink text-white" : "bg-strong text-body"
            )}
          >
            즐겨찾기
          </Link>
        </nav>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="아직 저장된 대화가 없습니다"
          description="Chatmore에게 대학 생활정보를 질문해 보세요."
          action={
            <Link
              href="/chat"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              질문하러 가기
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <ConversationRow
                conversation={{
                  id: c.id,
                  title: c.title,
                  category: c.category,
                  isBookmarked: c.isBookmarked,
                  updatedAt: c.updatedAt.toISOString(),
                  messageCount: c._count.messages,
                  lastQuestion: c.messages[0]?.content ?? "",
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
