import { describe, expect, it } from "vitest";
import { sanitizeNoticeHtml } from "@/lib/utils/sanitize";
import { safeHttpUrl } from "@/lib/utils/url";
import {
  bookmarkSchema,
  infoSourceSchema,
  personalEventSchema,
  profileSchema,
} from "@/lib/validation/schemas";

describe("공지 HTML 정화", () => {
  it("script·이벤트 속성·javascript: 링크를 제거한다", () => {
    const out = sanitizeNoticeHtml(
      `<p onclick="x()">안내</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">링크</a>`
    );
    expect(out).not.toMatch(/script|onerror|onclick|javascript:|<img/i);
    expect(out).toContain("<p>안내</p>");
  });

  it("허용 태그와 http 링크는 유지하고 새 창 속성을 붙인다", () => {
    const out = sanitizeNoticeHtml(`<h2>제목</h2><a href="https://www.scnu.ac.kr">원문</a>`);
    expect(out).toContain("<h2>제목</h2>");
    expect(out).toContain('href="https://www.scnu.ac.kr"');
    expect(out).toContain('rel="noreferrer noopener"');
  });
});

describe("원문 링크 검사", () => {
  it("http/https 만 통과", () => {
    expect(safeHttpUrl("https://a.kr")).toBe("https://a.kr");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("")).toBeNull();
  });
});

const baseSource = {
  title: "t",
  category: "장학금",
  summary: "s",
  content: "c",
  department: "d",
  targetUsers: "전체",
  dataStatus: "active",
  isAiSearchable: true,
};

describe("입력 검증", () => {
  it("관리자 데이터: javascript: URL·잘못된 날짜·종료<시작 거부", () => {
    expect(infoSourceSchema.safeParse({ ...baseSource, sourceUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(infoSourceSchema.safeParse({ ...baseSource, startAt: "2026-02-30" }).success).toBe(false);
    expect(infoSourceSchema.safeParse({ ...baseSource, startAt: "2026-03-10", endAt: "2026-03-01" }).success).toBe(false);
    expect(infoSourceSchema.safeParse({ ...baseSource, startAt: "2026-03-01", endAt: "2026-03-10", sourceUrl: "https://a.kr" }).success).toBe(true);
  });

  it("개인 일정: 날짜 형식이 아니면 거부", () => {
    expect(personalEventSchema.safeParse({ title: "시험", date: "abc" }).success).toBe(false);
    expect(personalEventSchema.safeParse({ title: "시험", date: "2026-10-08" }).success).toBe(true);
  });

  it("북마크: 알 수 없는 유형·빈 제목 거부", () => {
    expect(bookmarkSchema.safeParse({ itemType: "x", itemId: "1", title: "a" }).success).toBe(false);
    expect(bookmarkSchema.safeParse({ itemType: "notice", itemId: "1" }).success).toBe(false);
    expect(bookmarkSchema.safeParse({ itemType: "notice", itemId: "1", title: "공지" }).success).toBe(true);
  });

  it("프로필: 목록에 없는 사용자 유형·관심사 거부", () => {
    expect(profileSchema.safeParse({ userType: "해커", interests: [] }).success).toBe(false);
    expect(profileSchema.safeParse({ userType: "재학생", interests: ["장학금", "없는항목"] }).success).toBe(false);
    expect(profileSchema.safeParse({ userType: "재학생", interests: ["장학금"] }).success).toBe(true);
  });
});

describe("로그인 후 이동 경로(next) 검증", () => {
  it("학생 영역 내부 경로만 허용한다", async () => {
    const { safeNextPath } = await import("@/lib/utils/url");
    expect(safeNextPath("/calendar?month=2026-10")).toBe("/calendar?month=2026-10");
    expect(safeNextPath("/chat/abc")).toBe("/chat/abc");
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "evil", "/admin", "/admin/users", "/login", "/api/my-data", "", null]) {
      expect(safeNextPath(bad)).toBeNull();
    }
  });
});
