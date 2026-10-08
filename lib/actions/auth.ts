"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/database/db";
import { rateLimit } from "@/lib/auth/rate-limit";
import {
  clearAdminSession,
  clearUserSession,
  setAdminSession,
  setUserSession,
} from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";

export type FormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

function ip(): string {
  return headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** 학생 로그인 (데모 계정) */
export async function userLogin(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const rl = rateLimit(`ulogin:${ip()}`, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return { ok: false, message: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." };
  }
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "이메일과 비밀번호를 확인해 주세요." };
  }
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid =
    user &&
    user.status === "active" &&
    (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!valid) {
    return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다. 데모 계정 안내를 확인해 주세요." };
  }
  await db.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });
  setUserSession(user.id);
  redirect(user.onboarded ? "/home" : "/onboarding");
}

export async function userLogout() {
  clearUserSession();
  redirect("/login");
}

/** 회원가입 — 시범 운영 단계에서는 데모 계정만 지원 (정직하게 안내) */
export async function signupAttempt(
  _prev: FormState,
  _formData: FormData
): Promise<FormState> {
  return {
    ok: false,
    message:
      "시범 운영 단계에서는 회원가입이 제한됩니다. 로그인 화면의 데모 계정으로 서비스를 체험해 주세요. 정식 오픈 시 학교 계정 연동이 제공될 예정입니다.",
  };
}

/** 관리자 로그인 */
export async function adminLogin(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const rl = rateLimit(`alogin:${ip()}`, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return { ok: false, message: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요." };
  }
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "이메일과 비밀번호를 확인해 주세요." };
  }
  const admin = await db.admin.findUnique({ where: { email: parsed.data.email } });
  const valid =
    admin && (await bcrypt.compare(parsed.data.password, admin.passwordHash));
  if (!valid) {
    return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }
  setAdminSession(admin.id, formData.get("remember") === "on");
  redirect("/admin");
}

export async function adminLogout() {
  clearAdminSession();
  redirect("/admin/login");
}
