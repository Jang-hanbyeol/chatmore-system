import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * HMAC 서명 세션 (사용자/관리자 공용 헬퍼).
 * 토큰 형식: `${role}:${id}.${expires}.${signature}`
 */
const USER_COOKIE = "chatmore_user_session";
const ADMIN_COOKIE = "chatmore_admin_session";
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7; // 7일
const ADMIN_MAX_AGE = 60 * 60 * 8; // 8시간

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET 환경변수를 32자 이상으로 설정하세요.");
    }
    return "dev-only-insecure-secret";
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createToken(role: "user" | "admin", id: string, maxAge: number) {
  const expires = Date.now() + maxAge * 1000;
  const payload = `${role}:${id}.${expires}`;
  return { token: `${payload}.${sign(payload)}`, maxAge };
}

export function verifyToken(
  token: string | undefined,
  role: "user" | "admin"
): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [head, expires, sig] = parts;
  const expected = sign(`${head}.${expires}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expires) < Date.now()) return null;
  if (!head.startsWith(`${role}:`)) return null;
  return head.slice(role.length + 1);
}

function setCookie(name: string, role: "user" | "admin", id: string, maxAge: number) {
  const { token } = createToken(role, id, maxAge);
  cookies().set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export function setUserSession(userId: string) {
  setCookie(USER_COOKIE, "user", userId, DEFAULT_MAX_AGE);
}
export function clearUserSession() {
  cookies().delete(USER_COOKIE);
}
export function getSessionUserId(): string | null {
  return verifyToken(cookies().get(USER_COOKIE)?.value, "user");
}

export function setAdminSession(adminId: string, remember = false) {
  setCookie(ADMIN_COOKIE, "admin", adminId, remember ? 60 * 60 * 24 * 30 : ADMIN_MAX_AGE);
}
export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}
export function getSessionAdminId(): string | null {
  return verifyToken(cookies().get(ADMIN_COOKIE)?.value, "admin");
}

export const COOKIE_NAMES = { USER_COOKIE, ADMIN_COOKIE };
