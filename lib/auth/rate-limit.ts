/**
 * 간단한 메모리 기반 Rate Limiter (경량 데모 구성용).
 * 다중 인스턴스 배포 시에는 Redis 등 외부 저장소 기반으로 교체하세요.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, remaining: 0 };
  return { ok: true, remaining: limit - bucket.count };
}
