export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

/** 마감일까지 남은 일수. 지난 경우 음수 */
export function daysLeft(end: Date | string | null | undefined): number | null {
  if (!end) return null;
  const d = typeof end === "string" ? new Date(end) : end;
  return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function ddayLabel(end: Date | string | null | undefined): string | null {
  const n = daysLeft(end);
  if (n === null) return null;
  if (n < 0) return "마감됨";
  if (n === 0) return "오늘 마감";
  return `D-${n}`;
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return formatDate(d);
}

export function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  new: "신규",
  reviewing: "검토중",
  resolved: "해결됨",
  data_updated: "데이터 수정됨",
  model_review_required: "모델 검토 필요",
  closed: "종료",
};

export const DATA_STATUS_LABELS: Record<string, string> = {
  draft: "임시저장",
  active: "사용중",
  needs_review: "검토 필요",
  outdated: "만료",
  archived: "보관",
  sync_failed: "동기화 실패",
};

export function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
