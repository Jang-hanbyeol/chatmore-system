import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import { getSessionAdminId, getSessionUserId } from "./session";

/** 로그인한 사용자 조회. 없으면 /login 으로 이동 */
export async function requireUser() {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "active") redirect("/login");
  return user;
}

/** 온보딩까지 완료한 사용자. 미완료 시 /onboarding 으로 이동 */
export async function requireOnboardedUser() {
  const user = await requireUser();
  if (!user.onboarded) redirect("/onboarding");
  return user;
}

export async function requireAdmin() {
  const adminId = getSessionAdminId();
  if (!adminId) redirect("/admin/login");
  const admin = await db.admin.findUnique({ where: { id: adminId } });
  if (!admin) redirect("/admin/login");
  return admin;
}
