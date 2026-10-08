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

describe("Rate Limiter", () => {
  it("허용 횟수 초과 시 차단한다", async () => {
    const { rateLimit } = await import("@/lib/auth/rate-limit");
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60000).ok).toBe(true);
    expect(rateLimit(key, 3, 60000).ok).toBe(false);
  });
});
