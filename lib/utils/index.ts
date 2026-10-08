export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/* ── 날짜: 서버(Vercel, UTC)와 브라우저 모두 한국 시간(KST) 기준으로 계산·표시 ── */

export const TIME_ZONE = "Asia/Seoul";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

/** KST 기준 연·월(1~12)·일·시(0~23)·요일(0=일) */
export function kstParts(date: Date | string = new Date()) {
  const k = new Date(toDate(date).getTime() + KST_OFFSET_MS);
  return {
    year: k.getUTCFullYear(),
    month: k.getUTCMonth() + 1,
    day: k.getUTCDate(),
    hour: k.getUTCHours(),
    weekday: k.getUTCDay(),
  };
}

/** KST 날짜 문자열 YYYY-MM-DD (date input 값, 날짜 비교 키) */
export function kstDateKey(date: Date | string = new Date()): string {
  const { year, month, day } = kstParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** KST 해당 날짜 00:00 의 실제 시각 (month 는 1~12, 범위를 넘으면 자동 이월) */
export function kstStartOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - KST_OFFSET_MS);
}

/** 오늘(KST) 00:00 */
export function kstToday(): Date {
  const { year, month, day } = kstParts();
  return kstStartOfDay(year, month, day);
}

/** KST 달력 기준 일수 차이 (b - a) */
function kstDayDiff(a: Date, b: Date): number {
  const dayNo = (d: Date) => Math.floor((d.getTime() + KST_OFFSET_MS) / DAY_MS);
  return dayNo(b) - dayNo(a);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return toDate(date).toLocaleDateString("ko-KR", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const { month, day } = kstParts(date);
  return `${month}.${day}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return toDate(date).toLocaleString("ko-KR", {
    timeZone: TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date | string): string {
  return toDate(date).toLocaleTimeString("ko-KR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 마감일까지 남은 일수(KST 달력 기준). 오늘 마감이면 0, 지난 경우 음수 */
export function daysLeft(end: Date | string | null | undefined): number | null {
  if (!end) return null;
  return kstDayDiff(new Date(), toDate(end));
}

export function ddayLabel(end: Date | string | null | undefined): string | null {
  const n = daysLeft(end);
  if (n === null) return null;
  if (n < 0) return "마감됨";
  if (n === 0) return "오늘 마감";
  return `D-${n}`;
}

export function relativeTime(date: Date | string): string {
  const d = toDate(date);
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
