"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import { getSessionAdminId } from "@/lib/auth/session";
import {
  DATA_STATUSES,
  FEEDBACK_STATUSES,
  infoSourceSchema,
  noticeSchema,
} from "@/lib/validation/schemas";
import type { FormState } from "./auth";

async function requireAdminId(): Promise<string> {
  const adminId = getSessionAdminId();
  if (!adminId) redirect("/admin/login");
  return adminId;
}

async function log(
  adminId: string,
  action: string,
  resourceType: string,
  resourceId?: string
) {
  await db.adminActivityLog.create({
    data: { adminId, action, resourceType, resourceId: resourceId ?? null },
  });
}

function parseDate(s: string): Date | null {
  return s ? new Date(`${s}T09:00:00+09:00`) : null;
}

/* ── 대학 정보 데이터 (RAG 소스) ── */

export async function saveInfoSource(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const adminId = await requireAdminId();
  const id = String(formData.get("id") ?? "");
  const parsed = infoSourceSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    content: String(formData.get("content") ?? ""),
    department: String(formData.get("department") ?? ""),
    targetUsers: String(formData.get("targetUsers") ?? "전체"),
    keywords: String(formData.get("keywords") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    startAt: String(formData.get("startAt") ?? ""),
    endAt: String(formData.get("endAt") ?? ""),
    dataStatus: String(formData.get("dataStatus") ?? "draft"),
    isAiSearchable: formData.get("isAiSearchable") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "입력 내용을 확인해 주세요.", fieldErrors };
  }
  const d = parsed.data;
  const data = {
    ...d,
    sourceUrl: d.sourceUrl || null,
    keywords: d.keywords || "",
    startAt: parseDate(d.startAt || ""),
    endAt: parseDate(d.endAt || ""),
    dataCheckedAt: new Date(),
  };
  if (id) {
    await db.informationSource.update({ where: { id }, data });
    await log(adminId, "update", "information_source", id);
  } else {
    const created = await db.informationSource.create({ data });
    await log(adminId, "create", "information_source", created.id);
  }
  revalidatePath("/admin/data");
  redirect("/admin/data?saved=1");
}

export async function deleteInfoSource(id: string) {
  const adminId = await requireAdminId();
  await db.informationSource.delete({ where: { id } });
  await log(adminId, "delete", "information_source", id);
  revalidatePath("/admin/data");
}

/* ── 공지 ── */

export async function saveAdminNotice(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const adminId = await requireAdminId();
  const id = String(formData.get("id") ?? "");
  const parsed = noticeSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? "공지"),
    summary: String(formData.get("summary") ?? ""),
    content: String(formData.get("content") ?? ""),
    department: String(formData.get("department") ?? ""),
    targetUsers: String(formData.get("targetUsers") ?? "전체"),
    startAt: String(formData.get("startAt") ?? ""),
    endAt: String(formData.get("endAt") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    isPinned: formData.get("isPinned") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "입력 내용을 확인해 주세요.", fieldErrors };
  }
  const d = parsed.data;
  const data = {
    ...d,
    sourceUrl: d.sourceUrl || null,
    startAt: parseDate(d.startAt || ""),
    endAt: parseDate(d.endAt || ""),
  };
  if (id) {
    await db.notice.update({ where: { id }, data });
    await log(adminId, "update", "notice", id);
  } else {
    const created = await db.notice.create({ data });
    await log(adminId, "create", "notice", created.id);
  }
  revalidatePath("/admin/notices");
  revalidatePath("/notice");
  redirect("/admin/notices?saved=1");
}

export async function deleteAdminNotice(id: string) {
  const adminId = await requireAdminId();
  await db.notice.delete({ where: { id } });
  await log(adminId, "delete", "notice", id);
  revalidatePath("/admin/notices");
  revalidatePath("/notice");
}

/* ── 답변 품질 (피드백) ── */

export async function updateFeedbackStatus(formData: FormData) {
  const adminId = await requireAdminId();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const adminMemo = String(formData.get("adminMemo") ?? "");
  const assignee = String(formData.get("assignee") ?? "");
  if (!id || !(FEEDBACK_STATUSES as readonly string[]).includes(status)) return;
  await db.feedback.update({
    where: { id },
    data: { status, adminMemo: adminMemo || null, assignee: assignee || null },
  });
  await log(adminId, "update_status", "feedback", id);
  revalidatePath("/admin/answers");
  revalidatePath("/admin/feedback");
}

/* ── 오류 신고 ── */

export async function updateReportStatus(formData: FormData) {
  const adminId = await requireAdminId();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const adminMemo = String(formData.get("adminMemo") ?? "");
  if (!id || !["new", "reviewing", "resolved", "closed"].includes(status)) return;
  await db.report.update({
    where: { id },
    data: { status, adminMemo: adminMemo || null },
  });
  await log(adminId, "update_status", "report", id);
  revalidatePath("/admin/reports");
}

/* ── 사용자 관리 ── */

export async function updateUserStatus(formData: FormData) {
  const adminId = await requireAdminId();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["active", "inactive", "suspended"].includes(status)) return;
  await db.user.update({ where: { id }, data: { status } });
  await log(adminId, "update_status", "user", id);
  revalidatePath("/admin/users");
}

/* ── 카테고리 ── */

export async function saveCategory(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const adminId = await requireAdminId();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const isActive = formData.get("isActive") === "on";
  if (!name) return { ok: false, message: "카테고리 이름을 입력해 주세요." };
  if (id) {
    await db.category.update({
      where: { id },
      data: { name, sortOrder, isActive },
    });
    await log(adminId, "update", "category", id);
  } else {
    const created = await db.category.create({
      data: { name, slug: `cat-${Date.now()}`, sortOrder, isActive },
    });
    await log(adminId, "create", "category", created.id);
  }
  revalidatePath("/admin/categories");
  return { ok: true, message: "카테고리가 저장되었습니다." };
}

export async function deleteCategory(id: string) {
  const adminId = await requireAdminId();
  await db.category.delete({ where: { id } });
  await log(adminId, "delete", "category", id);
  revalidatePath("/admin/categories");
}
