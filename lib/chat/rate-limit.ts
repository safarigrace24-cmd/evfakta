/**
 * Simple in-memory rate limit for /api/chat.
 * Best-effort per serverless instance — not a global store.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const CHAT_RATE_LIMIT_MAX = 20;
export const CHAT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export function checkChatRateLimit(key: string):
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS,
    });
    return { ok: true, remaining: CHAT_RATE_LIMIT_MAX - 1 };
  }

  if (existing.count >= CHAT_RATE_LIMIT_MAX) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { ok: true, remaining: CHAT_RATE_LIMIT_MAX - existing.count };
}

/** Test helper — clears buckets between unit tests. */
export function resetChatRateLimitForTests(): void {
  buckets.clear();
}
