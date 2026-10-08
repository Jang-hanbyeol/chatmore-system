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
  return db.feedback.create({
    data: {
      userId: input.userId,
      messageId: input.messageId,
      feedbackType: input.feedbackType,
      reason: input.reason || null,
      comment: input.comment || null,
      status: input.feedbackType === "not_helpful" ? "new" : "closed",
    },
  });
}
