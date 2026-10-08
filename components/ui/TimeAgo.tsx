import { relativeTime } from "@/lib/utils";

/**
 * "3분 전" 같은 상대 시각. 서버 렌더와 브라우저 하이드레이션 사이의 몇 초 차이로
 * 문구가 달라질 수 있어 이 요소에 한해 불일치 경고를 무시한다.
 */
export function TimeAgo({ date }: { date: Date | string }) {
  const iso = typeof date === "string" ? date : date.toISOString();
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {relativeTime(iso)}
    </time>
  );
}
