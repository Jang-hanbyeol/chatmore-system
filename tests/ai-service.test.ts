import { describe, expect, it } from "vitest";
import { tokenize, searchSources } from "@/lib/ai/rag-service";
import { generateAnswer } from "@/lib/ai/chat-service";

/** 이 테스트는 시드된 SQLite DB(prisma/dev.db)를 사용합니다. */

describe("RAG 토크나이저", () => {
  it("불용어와 짧은 토큰을 제거한다", () => {
    const tokens = tokenize("이번 학기 장학금 신청 방법 알려줘");
    expect(tokens).toContain("장학금");
    expect(tokens).not.toContain("알려줘");
  });
});

describe("RAG 검색 (시드 데이터 기반)", () => {
  it("장학금 질문에 장학금 데이터를 찾는다", async () => {
    const results = await searchSources("신청 가능한 장학금 알려줘", 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].category).toBe("장학금");
  });

  it("AI 검색 제외 데이터는 검색되지 않는다", async () => {
    const results = await searchSources("지난 학기 장학금", 5);
    expect(results.every((r) => r.isAiSearchable)).toBe(true);
  });
});

describe("Mock 챗봇 서비스", () => {
  it("출처·후속 질문을 포함한 ChatResponse 규격을 반환한다", async () => {
    const res = await generateAnswer({ message: "도서관 운영시간 알려줘" });
    expect(res.status === "success" || res.status === "partial").toBe(true);
    expect(res.sources.length).toBeGreaterThan(0);
    expect(res.sources[0]).toHaveProperty("sourceUrl");
    expect(res.followUpQuestions?.length).toBeGreaterThan(0);
    expect(res.isDemo).toBe(true);
  });

  it("데이터가 없는 질문에는 no_result 를 반환한다", async () => {
    const res = await generateAnswer({ message: "화성 이주 방법" });
    expect(res.status).toBe("no_result");
    expect(res.sources.length).toBe(0);
  });
});
