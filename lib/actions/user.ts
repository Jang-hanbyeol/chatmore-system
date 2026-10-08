"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import { getActiveUserId } from "@/lib/auth/guards";
import { clearUserSession } from "@/lib/auth/session";
import { recordFeedback } from "@/lib/ai/feedback-service";
import {
  bookmarkSchema,
  feedbackSchema,
  onboardingSchema,
  personalEventSchema,
  profileSchema,
  reportSchema,
  settingsSchema,
} from "@/lib/validation/schemas";
import type { FormState } from "./auth";

/* ── 온보딩 ── */

export async function saveOnboarding(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await getActiveUserId();
  if (!userId) redirect("/login");
  const parsed = onboardingSchema.safeParse({
    userType: String(formData.get("userType") ?? ""),
    college: String(formData.get("college") ?? ""),
    department: String(formData.get("department") ?? ""),
    grade: String(formData.get("grade") ?? ""),
    admissionYear: String(formData.get("admissionYear") ?? ""),
    interests: formData.getAll("interests").map(String),
    notifySchedule: formData.get("notifySchedule") === "on",
    notifyScholarship: formData.get("notifyScholarship") === "on",
    notifyProgram: formData.get("notifyProgram") === "on",
    notifyBookmark: formData.get("notifyBookmark") === "on",
    notifyRecommend: formData.get("notifyRecommend") === "on",
  });
  if (!parsed.success) {
    return { ok: false, message: "입력 내용을 확인해 주세요." };
  }
  const d = parsed.data;
  await db.user.update({
    where: { id: userId },
    data: {
      userType: d.userType,
      college: d.college || null,
      department: d.department || null,
      grade: d.grade || null,
      admissionYear: d.admissionYear || null,
      interests: d.interests.join(","),
      notifySchedule: d.notifySchedule,
      notifyScholarship: d.notifyScholarship,
      notifyProgram: d.notifyProgram,
      notifyBookmark: d.notifyBookmark,
      notifyRecommend: d.notifyRecommend,
      onboarded: true,
    },
  });
  redirect("/home?onboarded=1");
}

/* ── 북마크 ── */

export async function toggleBookmark(input: {
  itemType: "answer" | "notice" | "schedule" | "source" | "question";
  itemId: string;
  title: string;
  meta?: string;
}): Promise<{ ok: boolean; bookmarked: boolean }> {
  const userId = await getActiveUserId();
  if (!userId) return { ok: false, bookmarked: false };
  const parsed = bookmarkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, bookmarked: false };
  const { itemType, itemId, title, meta } = parsed.data;
  // deleteMany/create 조합: 연타로 두 요청이 겹쳐도 P2002 대신 최종 상태로 수렴
  const removed = await db.bookmark.deleteMany({ where: { userId, itemType, itemId } });
  if (removed.count > 0) {
    revalidatePath("/", "layout");
    return { ok: true, bookmarked: false };
  }
  try {
    await db.bookmark.create({
      data: { userId, itemType, itemId, title, meta: meta ?? null },
    });
  } catch (e) {
    if ((e as { code?: string }).code !== "P2002") throw e; // 동시 요청이 먼저 만듦
  }
  revalidatePath("/", "layout");
  return { ok: true, bookmarked: true };
}

export async function removeBookmark(id: string) {
  const userId = await getActiveUserId();
  if (!userId) return;
  await db.bookmark.deleteMany({ where: { id: String(id), userId } });
  revalidatePath("/", "layout");
}

/* ── 알림 ── */

export async function markNotificationRead(id: string) {
  const userId = await getActiveUserId();
  if (!userId) return;
  await db.notification.updateMany({
    where: { id: String(id), userId },
    data: { isRead: true },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const userId = await getActiveUserId();
  if (!userId) return;
  await db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/", "layout");
}

/* ── 답변 평가 / 오류 신고 ── */

export async function submitAnswerFeedback(input: {
  messageId: string;
  feedbackType: "helpful" | "not_helpful";
  reason?: string;
  comment?: string;
}): Promise<{ ok: boolean; message: string }> {
  const userId = await getActiveUserId();
  if (!userId) return { ok: false, message: "로그인이 필요합니다." };
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "입력을 확인해 주세요." };
  const msg = await db.message.findFirst({
    where: { id: parsed.data.messageId, conversation: { userId } },
  });
  if (!msg) return { ok: false, message: "답변을 찾을 수 없습니다." };
  await recordFeedback({ userId, ...parsed.data });
  revalidatePath("/admin/answers");
  return {
    ok: true,
    message: "의견이 접수되었습니다. 보내주신 내용은 답변 품질 개선에 활용됩니다.",
  };
}

export async function submitReport(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await getActiveUserId();
  if (!userId) return { ok: false, message: "로그인이 필요합니다." };
  const parsed = reportSchema.safeParse({
    reportType: String(formData.get("reportType") ?? ""),
    messageId: String(formData.get("messageId") ?? ""),
    content: String(formData.get("content") ?? ""),
    contactBack: formData.get("contactBack") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "입력 내용을 확인해 주세요.", fieldErrors };
  }
  // 본인 대화의 메시지만 연결 (임의 id로 FK 오류·타인 메시지 노출 방지)
  const ownMessage = parsed.data.messageId
    ? await db.message.findFirst({
        where: { id: parsed.data.messageId, conversation: { userId } },
        select: { id: true },
      })
    : null;
  await db.report.create({
    data: {
      userId,
      reportType: parsed.data.reportType,
      messageId: ownMessage?.id ?? null,
      content: parsed.data.content,
      contactBack: parsed.data.contactBack,
    },
  });
  return {
    ok: true,
    message: "의견이 접수되었습니다. 보내주신 내용은 답변 품질 개선에 활용됩니다.",
  };
}

/* ── 설정 ── */

export async function saveSettings(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await getActiveUserId();
  if (!userId) redirect("/login");
  const parsed = settingsSchema.safeParse({
    answerLength: String(formData.get("answerLength") ?? "detailed"),
    autoExpandSources: formData.get("autoExpandSources") === "on",
    showSuggestions: formData.get("showSuggestions") === "on",
    saveHistory: formData.get("saveHistory") === "on",
    allowPersonalization: formData.get("allowPersonalization") === "on",
    fontSize: String(formData.get("fontSize") ?? "default"),
    highContrast: formData.get("highContrast") === "on",
    reduceMotion: formData.get("reduceMotion") === "on",
    language: String(formData.get("language") ?? "ko"),
  });
  if (!parsed.success) return { ok: false, message: "입력을 확인해 주세요." };
  await db.user.update({ where: { id: userId }, data: parsed.data });
  revalidatePath("/settings");
  return { ok: true, message: "설정이 저장되었습니다." };
}

export async function updateProfile(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await getActiveUserId();
  if (!userId) redirect("/login");
  const parsed = profileSchema.safeParse({
    userType: String(formData.get("userType") ?? "재학생"),
    college: String(formData.get("college") ?? ""),
    department: String(formData.get("department") ?? ""),
    grade: String(formData.get("grade") ?? ""),
    admissionYear: String(formData.get("admissionYear") ?? ""),
    interests: formData.getAll("interests").map(String),
  });
  if (!parsed.success) return { ok: false, message: "입력 내용을 확인해 주세요." };
  const d = parsed.data;
  await db.user.update({
    where: { id: userId },
    data: {
      userType: d.userType,
      department: d.department || null,
      grade: d.grade || null,
      interests: d.interests.join(","),
      // 프로필 폼에 없는 항목은 기존 값 유지
      ...(formData.has("college") ? { college: d.college || null } : {}),
      ...(formData.has("admissionYear") ? { admissionYear: d.admissionYear || null } : {}),
    },
  });
  revalidatePath("/settings");
  return { ok: true, message: "프로필이 저장되었습니다." };
}

/** 대화 기록 전체 삭제 (개인정보 설정) */
export async function deleteChatHistory(): Promise<FormState> {
  const userId = await getActiveUserId();
  if (!userId) return { ok: false, message: "로그인이 필요합니다." };
  await db.conversation.deleteMany({ where: { userId } });
  revalidatePath("/", "layout");
  return { ok: true, message: "대화 기록이 모두 삭제되었습니다." };
}

/** 회원 탈퇴 — 데모 계정은 보호 */
export async function withdrawAccount(): Promise<FormState> {
  const userId = await getActiveUserId();
  if (!userId) return { ok: false, message: "로그인이 필요합니다." };
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, message: "사용자를 찾을 수 없습니다." };
  if (user.isDemo) {
    return {
      ok: false,
      message: "데모 계정은 탈퇴할 수 없습니다. 정식 서비스에서는 즉시 탈퇴와 데이터 삭제가 지원됩니다.",
    };
  }
  // 개인정보 즉시 삭제: 대화·메시지·피드백·신고·북마크·알림은 FK Cascade,
  // 개인 일정은 관계가 없는 userId 컬럼이라 직접 삭제
  await db.$transaction([
    db.scheduleEvent.deleteMany({ where: { userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);
  clearUserSession();
  redirect("/login");
}

/* ── 개인 일정 ── */

export async function addPersonalEvent(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await getActiveUserId();
  if (!userId) return { ok: false, message: "로그인이 필요합니다." };
  const parsed = personalEventSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    date: String(formData.get("date") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "제목과 올바른 날짜를 입력해 주세요." };
  const { title, date } = parsed.data;
  const count = await db.scheduleEvent.count({ where: { userId } });
  if (count >= 200) return { ok: false, message: "개인 일정은 최대 200개까지 등록할 수 있습니다." };
  await db.scheduleEvent.create({
    data: {
      title,
      category: "개인",
      startAt: new Date(`${date}T09:00:00+09:00`),
      userId,
    },
  });
  revalidatePath("/calendar");
  return { ok: true, message: "개인 일정이 추가되었습니다." };
}

export async function deletePersonalEvent(id: string) {
  const userId = await getActiveUserId();
  if (!userId) return;
  await db.scheduleEvent.deleteMany({ where: { id: String(id), userId } });
  revalidatePath("/calendar");
}
