import type { Metadata } from "next";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { ChatScreen } from "@/components/chat/ChatScreen";

export const metadata: Metadata = { title: "챗봇" };
export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const user = await requireOnboardedUser();
  const conversations = await db.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  return (
    <ChatScreen
      conversations={conversations.map((c) => ({
        id: c.id,
        title: c.title,
        isBookmarked: c.isBookmarked,
        updatedAt: c.updatedAt.toISOString(),
      }))}
      activeId={null}
      activeTitle={null}
      initialMessages={[]}
      initialQuestion={searchParams.q?.slice(0, 500)}
      showSuggestions={user.showSuggestions}
      autoExpandSources={user.autoExpandSources}
    />
  );
}
