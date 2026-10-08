import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-key-for-vitest-1234567890";
});

describe("세션 토큰", () => {
  it("역할별 토큰을 생성·검증한다", async () => {
    const { createToken, verifyToken } = await import("@/lib/auth/session");
    const { token } = createToken("user", "user-1", 3600);
    expect(verifyToken(token, "user")).toBe("user-1");
    // 사용자 토큰으로 관리자 검증 불가
    expect(verifyToken(token, "admin")).toBeNull();
  });

  it("위조·만료 토큰을 거부한다", async () => {
    const { createToken, verifyToken } = await import("@/lib/auth/session");
    const { token } = createToken("admin", "a-1", 3600);
    const [head, exp] = token.split(".");
    expect(verifyToken(`${head}.${exp}.forged-sig-000000`, "admin")).toBeNull();
    const { token: expired } = createToken("admin", "a-1", -10);
    expect(verifyToken(expired, "admin")).toBeNull();
  });
});

describe("Rate Limiter (DB 기반)", () => {
  it("허용 횟수 초과 시 차단한다", async () => {
    const { rateLimit } = await import("@/lib/auth/rate-limit");
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect((await rateLimit(key, 3, 60000)).ok).toBe(true);
    expect((await rateLimit(key, 3, 60000)).ok).toBe(false);
  });

  it("동시 요청도 정확히 센다 (인스턴스 간 공유 저장소 가정)", async () => {
    const { rateLimit } = await import("@/lib/auth/rate-limit");
    const key = `c-${Math.random()}`;
    const results = await Promise.all(
      Array.from({ length: 8 }, () => rateLimit(key, 5, 60000))
    );
    expect(results.filter((r) => r.ok)).toHaveLength(5);
  });

  it("윈도우가 지나면 다시 허용한다", async () => {
    const { rateLimit } = await import("@/lib/auth/rate-limit");
    const key = `w-${Math.random()}`;
    expect((await rateLimit(key, 1, 1)).ok).toBe(true);
    await new Promise((r) => setTimeout(r, 5));
    expect((await rateLimit(key, 1, 1)).ok).toBe(true);
  });
});
