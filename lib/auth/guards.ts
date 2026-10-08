import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import { getSessionAdminId, getSessionUserId } from "./session";

/**
 * 세션 쿠키가 가리키는 활성 사용자. 서명이 유효해도 DB에 없거나 비활성이면 null.
 * 로그인 페이지 등 "이미 로그인했으면 이동" 판단도 반드시 이 함수로 해야
 * requireUser 와 기준이 어긋나 /login ↔ /home 무한 리다이렉트가 생기지 않는다.
 */
export async function getActiveUser() {
  const userId = getSessionUserId();
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  return user && user.status === "active" ? user : null;
}

/** 로그인한 사용자 조회. 없으면 /login 으로 이동 */
export async function requireUser() {
  const user = await getActiveUser();
  if (!user) redirect("/login");
  return user;
}

/** 온보딩까지 완료한 사용자. 미완료 시 /onboarding 으로 이동 */
export async function requireOnboardedUser() {
  const user = await requireUser();
  if (!user.onboarded) redirect("/onboarding");
  return user;
}

/** 세션 쿠키가 가리키는 관리자. DB에 없으면 null (getActiveUser 와 같은 이유) */
export async function getActiveAdmin() {
  const adminId = getSessionAdminId();
  if (!adminId) return null;
  return db.admin.findUnique({ where: { id: adminId } });
}

export async function requireAdmin() {
  const admin = await getActiveAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
