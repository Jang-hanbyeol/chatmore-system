/** 외부 원문 링크: http/https 만 통과 (javascript: 등 그 외 스킴은 null) */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}
