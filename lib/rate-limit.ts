/**
 * In-memory token-bucket rate limiter.
 *
 * Limitation: state lives in-process. For multi-instance deployments, swap for
 * Redis/Upstash. For a single Next.js dev/start process this is fine.
 *
 * Usage:
 *   if (!rateLimit(`login:${ip}`, 5, 60_000)) {
 *     return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *   }
 */

type Bucket = { tokens: number; lastRefill: number };

// globalThis to survive HMR in dev
const g = globalThis as unknown as { __rateLimitBuckets?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = g.__rateLimitBuckets ?? new Map();
g.__rateLimitBuckets = buckets;

/**
 * @param key      Unique key (e.g. `login:1.2.3.4`)
 * @param max      Max tokens per window (also the burst capacity)
 * @param windowMs Time window in milliseconds
 * @returns true if the request is allowed; false if the bucket is empty
 */
export function rateLimit(key: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: max, lastRefill: now };
  const elapsed = now - bucket.lastRefill;
  const refilled = Math.min(max, bucket.tokens + (elapsed / windowMs) * max);

  if (refilled < 1) {
    buckets.set(key, { tokens: refilled, lastRefill: now });
    return false;
  }

  buckets.set(key, { tokens: refilled - 1, lastRefill: now });
  return true;
}

/** Extract the request's client IP from common headers. */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
