"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/database/db";
import { rateLimit } from "@/lib/auth/rate-limit";
import { getActiveUserId } from "@/lib/auth/guards";
import { generateAnswer } from "@/lib/ai/chat-service";
import { chatMessageSchema, conversationTitleSchema } from "@/lib/validation/schemas";
import { truncate } from "@/lib/utils";
import type { ChatResponse } from "@/types/chat";

export type SendResult =
  | {
      ok: true;
      conversationId: string;
      userMessageId: string;
      assistantMessageId: string;
      response: ChatResponse;
    }
  | { ok: false; error: string };

function ip(): string {
  return headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** 민감정보 패턴 자동 마스킹 (저장 전) */
function maskSensitive(text: string): string {
  return text
    .replace(/\d{6}-\d{7}/g, "[주민등록번호 마스킹]")
    .replace(/\d{2,3}-\d{3,4}-\d{4}/g, "[전화번호 마스킹]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[이메일 마스킹]");
}

/** 질문 전송: 대화 생성 → 사용자 메시지 저장 → AI 응답 생성·저장 */
export async function sendChatMessage(input: {
  conversationId?: string;
  message: string;
}): Promise<SendResult> {
  const userId = await getActiveUserId();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  const rl = rateLimit(`chat:${userId}`, 30, 60 * 1000);
  if (!rl.ok)
    return { ok: false, error: "질문이 너무 많습니다. 잠시 후 다시 시도해 주세요." };

  const parsed = chatMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "질문을 입력해 주세요." };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const question = maskSensitive(parsed.data.message.trim());

  // 대화 확보
  let conversationId = parsed.data.conversationId;
  if (conversationId) {
    const conv = await db.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conv) return { ok: false, error: "대화를 찾을 수 없습니다." };
  } else {
    const conv = await db.conversation.create({
      data: { userId, title: truncate(question, 30) },
    });
    conversationId = conv.id;
  }

  const userMessage = await db.message.create({
    data: { conversationId, role: "user", content: question },
  });

  try {
    const response = await generateAnswer({
      conversationId,
      message: question,
      userContext: {
        userType: user.userType,
        department: user.department ?? undefined,
        grade: user.grade ?? undefined,
        interests: user.interests ? user.interests.split(",") : [],
      },
    });

    const assistant = await db.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: response.answer,
        status: response.status,
        summary: response.summary ?? null,
        sourcesJson: JSON.stringify(response.sources),
        noticesJson: JSON.stringify(response.relatedNotices ?? []),
        followUpsJson: JSON.stringify(response.followUpQuestions ?? []),
        modelName: response.isDemo ? "chatmore-mock" : "chatmore-remote",
        dataCheckedAt: response.dataCheckedAt ?? null,
      },
    });

    // 대화 카테고리 갱신 (첫 출처 기준)
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        category: response.sources[0]?.category ?? undefined,
      },
    });

    // revalidatePath 를 부르지 않는다: 액션 응답에 현재 페이지(/chat?q=…) 재렌더가 실려
    // 채팅 화면이 다시 마운트되며 초기 질문을 한 번 더 보냈다. 목록 갱신은 클라이언트가
    // router.replace/refresh 로 처리한다.
    return {
      ok: true,
      conversationId,
      userMessageId: userMessage.id,
      assistantMessageId: assistant.id,
      response: { ...response, conversationId, answerId: assistant.id },
    };
  } catch (e) {
    console.error("chat generate error", e);
    await db.message.create({
      data: {
        conversationId,
        role: "assistant",
        content:
          "일시적으로 답변을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        status: "error",
      },
    });
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return { ok: false, error: "답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function renameConversation(id: string, title: string) {
  const userId = await getActiveUserId();
  if (!userId) return;
  const parsed = conversationTitleSchema.safeParse(title);
  await db.conversation.updateMany({
    where: { id: String(id), userId },
    data: { title: parsed.success ? parsed.data.slice(0, 50) : "새 대화" },
  });
  revalidatePath("/history");
  revalidatePath("/chat", "layout");
}

export async function toggleConversationBookmark(id: string) {
  const userId = await getActiveUserId();
  if (!userId) return;
  const conv = await db.conversation.findFirst({ where: { id: String(id), userId } });
  if (!conv) return;
  await db.conversation.update({
    where: { id: conv.id },
    data: { isBookmarked: !conv.isBookmarked },
  });
  revalidatePath("/history");
  revalidatePath("/chat", "layout");
}

export async function deleteConversation(id: string) {
  const userId = await getActiveUserId();
  if (!userId) return;
  await db.conversation.deleteMany({ where: { id: String(id), userId } });
  revalidatePath("/history");
  revalidatePath("/chat", "layout");
}

export async function deleteAllConversations() {
  const userId = await getActiveUserId();
  if (!userId) return;
  await db.conversation.deleteMany({ where: { userId } });
  revalidatePath("/history");
  revalidatePath("/chat", "layout");
}
