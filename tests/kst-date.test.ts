import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  daysLeft,
  ddayLabel,
  formatDateTime,
  formatShortDate,
  kstDateKey,
  kstParts,
  kstStartOfDay,
  kstToday,
} from "@/lib/utils";

// KST 2026-10-08 01:30 = UTC 2026-10-07 16:30 (서버가 UTC면 아직 "어제"인 시각)
const NOW = new Date("2026-10-07T16:30:00Z");

describe("KST 날짜 계산 (서버가 UTC여도 한국 날짜 기준)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("오늘 날짜·시각을 KST로 계산한다", () => {
    expect(kstDateKey()).toBe("2026-10-08");
    expect(kstParts().hour).toBe(1);
    expect(kstToday().toISOString()).toBe("2026-10-07T15:00:00.000Z");
  });

  it("표시 형식도 KST", () => {
    expect(formatShortDate(NOW)).toBe("10.8");
    expect(formatDateTime(NOW)).toContain("01:30");
  });

  it("마감 D-day는 KST 달력 기준", () => {
    // 데이터는 KST 09:00 으로 저장된다 (관리자 입력·시드 규칙)
    expect(daysLeft(new Date("2026-10-08T09:00:00+09:00"))).toBe(0);
    expect(ddayLabel(new Date("2026-10-08T09:00:00+09:00"))).toBe("오늘 마감");
    expect(ddayLabel(new Date("2026-10-09T09:00:00+09:00"))).toBe("D-1");
    expect(ddayLabel(new Date("2026-10-07T09:00:00+09:00"))).toBe("마감됨");
  });

  it("월 경계: KST 11월 1일 00:00 과 다음 달 이월", () => {
    expect(kstStartOfDay(2026, 11, 1).toISOString()).toBe("2026-10-31T15:00:00.000Z");
    expect(kstStartOfDay(2026, 13, 1).toISOString()).toBe("2026-12-31T15:00:00.000Z");
  });
});
