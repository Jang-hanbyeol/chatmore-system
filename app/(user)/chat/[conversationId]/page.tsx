import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { ChatScreen, type UiMessage } from "@/components/chat/ChatScreen";
import { parseJson } from "@/lib/utils";
import type { RelatedNotice, SourceItem } from "@/types/chat";

export const metadata: Metadata = { title: "챗봇" };
export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const user = await requireOnboardedUser();
  const conversation = await db.conversation.findFirst({
    where: { id: params.conversationId, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) notFound();

  const conversations = await db.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const messages: UiMessage[] = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    status: m.status,
    summary: m.summary,
    sources: parseJson<SourceItem[]>(m.sourcesJson, []),
    notices: parseJson<RelatedNotice[]>(m.noticesJson, []),
    followUps: parseJson<string[]>(m.followUpsJson, []),
    dataCheckedAt: m.dataCheckedAt,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <ChatScreen
      conversations={conversations.map((c) => ({
        id: c.id,
        title: c.title,
        isBookmarked: c.isBookmarked,
        updatedAt: c.updatedAt.toISOString(),
      }))}
      activeId={conversation.id}
      activeTitle={conversation.title}
      initialMessages={messages}
      showSuggestions={user.showSuggestions}
      autoExpandSources={user.autoExpandSources}
    />
  );
}
