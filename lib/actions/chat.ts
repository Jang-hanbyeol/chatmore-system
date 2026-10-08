"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/database/db";
import { rateLimit } from "@/lib/auth/rate-limit";
import { getSessionUserId } from "@/lib/auth/session";
import { generateAnswer } from "@/lib/ai/chat-service";
import { chatMessageSchema } from "@/lib/validation/schemas";
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
  const userId = getSessionUserId();
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

    // 히스토리 저장 미사용 사용자는 저장 직후 삭제하지 않고, 조회 시 필터
    revalidatePath("/history");
    return {
      ok: true,
      conversationId,
      userMessageId: userMessage.id,
      assistantMessageId: assistant.id,
      response: { ...response, conversationId, answerId: assistant.id },
    };
  } catch (e) {
    console.error("chat generate error");
    await db.message.create({
      data: {
        conversationId,
        role: "assistant",
        content:
          "일시적으로 답변을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        status: "error",
      },
    });
    return { ok: false, error: "답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function renameConversation(id: string, title: string) {
  const userId = getSessionUserId();
  if (!userId) return;
  await db.conversation.updateMany({
    where: { id, userId },
    data: { title: title.trim().slice(0, 50) || "새 대화" },
  });
  revalidatePath("/history");
}

export async function toggleConversationBookmark(id: string) {
  const userId = getSessionUserId();
  if (!userId) return;
  const conv = await db.conversation.findFirst({ where: { id, userId } });
  if (!conv) return;
  await db.conversation.update({
    where: { id },
    data: { isBookmarked: !conv.isBookmarked },
  });
  revalidatePath("/history");
}

export async function deleteConversation(id: string) {
  const userId = getSessionUserId();
  if (!userId) return;
  await db.conversation.deleteMany({ where: { id, userId } });
  revalidatePath("/history");
  revalidatePath("/chat");
}

export async function deleteAllConversations() {
  const userId = getSessionUserId();
  if (!userId) return;
  await db.conversation.deleteMany({ where: { userId } });
  revalidatePath("/history");
  revalidatePath("/chat");
}
