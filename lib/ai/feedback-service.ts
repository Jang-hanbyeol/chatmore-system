import { db } from "@/lib/database/db";

/**
 * 피드백 서비스 레이어.
 * 사용자 평가를 저장하고, 실제 AI 서버 연동 시 이곳에서
 * 모델 개선 파이프라인(재학습 데이터 큐 등)으로 전달하도록 확장합니다.
 */

export async function recordFeedback(input: {
  userId: string;
  messageId: string;
  feedbackType: "helpful" | "not_helpful";
  reason?: string;
  comment?: string;
}) {
  const data = {
    feedbackType: input.feedbackType,
    reason: input.reason || null,
    comment: input.comment || null,
    status: input.feedbackType === "not_helpful" ? "new" : "closed",
  };
  // 같은 사용자가 같은 답변을 다시 평가하면 새로 쌓지 않고 마지막 평가로 갱신 (통계 왜곡 방지)
  const existing = await db.feedback.findFirst({
    where: { userId: input.userId, messageId: input.messageId },
    select: { id: true },
  });
  if (existing) return db.feedback.update({ where: { id: existing.id }, data });
  return db.feedback.create({
    data: { userId: input.userId, messageId: input.messageId, ...data },
  });
}
