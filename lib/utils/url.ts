/**
 * 로그인 후 이동 경로 검증: 같은 사이트의 학생 영역 경로만 허용 (open redirect 방지).
 * "//evil.com", "/\evil.com", 절대 URL, 관리자·로그인·API 경로는 거부.
 */
export function safeNextPath(raw: unknown): string | null {
  const next = typeof raw === "string" ? raw.trim() : "";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  if (/^\/(admin|login|signup|api)(\/|\?|$)/.test(next)) return null;
  return next.slice(0, 500);
}

/** 외부 원문 링크: http/https 만 통과 (javascript: 등 그 외 스킴은 null) */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}
