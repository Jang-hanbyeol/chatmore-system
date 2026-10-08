import { headers } from "next/headers";
import { db } from "@/lib/database/db";

/**
 * DB 기반 고정 윈도우 Rate Limiter.
 * 서버리스(Vercel)는 인스턴스마다 메모리가 따로라 메모리 Map 으로는 제한이 걸리지 않으므로
 * 공유 DB(Turso)의 RateLimit 테이블에 원자적으로 기록한다 (INSERT … ON CONFLICT … RETURNING).
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number }> {
  const now = Date.now();
  const resetAt = now + windowMs;
  const rows = await db.$queryRaw<{ count: number | bigint }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);

  // 만료 행 정리 (가끔만 — 매 요청 비용을 늘리지 않도록)
  if (Math.random() < 0.01) {
    await db.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" <= ${now}`;
  }
  return { ok: count <= limit, remaining: Math.max(limit - count, 0) };
}

/**
 * 요청자 IP. Vercel 은 x-real-ip 를 플랫폼이 직접 설정하므로 위조할 수 없다.
 * x-forwarded-for 첫 값은 클라이언트가 임의로 넣을 수 있어 대체 수단으로만 쓴다.
 */
export function clientIp(): string {
  const h = headers();
  return (
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
