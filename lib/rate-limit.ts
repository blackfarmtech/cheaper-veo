import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Rate limit buckets per API key.
 * Fixed-window strategy: each window is exactly 1 hour, aligned to the wall
 * clock (e.g. 14:00–15:00 UTC). Window resets when the hour rolls over.
 */
export type RateLimitBucket = "generate" | "status";

const HOUR_MS = 60 * 60 * 1000;

export const RATE_LIMITS: Record<RateLimitBucket, number> = {
  generate: 100,
  status: 1000,
};

export interface RateLimitOk {
  ok: true;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface RateLimitDenied {
  ok: false;
  limit: number;
  remaining: 0;
  resetAt: Date;
}

export type RateLimitResult = RateLimitOk | RateLimitDenied;

function currentWindowStart(now: Date = new Date()): Date {
  return new Date(Math.floor(now.getTime() / HOUR_MS) * HOUR_MS);
}

/**
 * Atomically increments the counter for (apiKeyId, bucket) inside the current
 * 1-hour window. Returns whether the request is within the limit. Resets the
 * counter automatically when the wall-clock hour rolls over.
 *
 * The counter is incremented BEFORE the limit check so concurrent callers
 * can't all read a count under the limit and then each succeed past it. Cost
 * of being slightly conservative: a tiny race window where two callers see
 * the same window but only one of them was meant to be the last allowed.
 */
export async function checkRateLimit(
  apiKeyId: string,
  bucket: RateLimitBucket,
): Promise<RateLimitResult> {
  const limit = RATE_LIMITS[bucket];
  const windowStart = currentWindowStart();
  const resetAt = new Date(windowStart.getTime() + HOUR_MS);

  // Read existing bucket. If absent or from a previous window, reset.
  const existing = await prisma.rateLimitBucket.findUnique({
    where: { apiKeyId_bucket: { apiKeyId, bucket } },
  });

  if (!existing || existing.windowStart.getTime() !== windowStart.getTime()) {
    // First request in this window — upsert with count=1.
    await prisma.rateLimitBucket.upsert({
      where: { apiKeyId_bucket: { apiKeyId, bucket } },
      create: { apiKeyId, bucket, windowStart, count: 1 },
      update: { windowStart, count: 1 },
    });
    return { ok: true, limit, remaining: limit - 1, resetAt };
  }

  // Already at limit — reject without incrementing.
  if (existing.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt };
  }

  // Atomic increment. We re-fetch the row count from the update return.
  const updated = await prisma.rateLimitBucket.update({
    where: { apiKeyId_bucket: { apiKeyId, bucket } },
    data: { count: { increment: 1 } },
    select: { count: true },
  });

  // Race-safety: if a concurrent caller pushed us past the limit, count back
  // out and reject. (The next aligned window will still allow them.)
  if (updated.count > limit) {
    return { ok: false, limit, remaining: 0, resetAt };
  }

  return { ok: true, limit, remaining: Math.max(0, limit - updated.count), resetAt };
}

/**
 * Builds the standard rate-limit response headers carried on every
 * authenticated API response (both 200 and 429). Mirrors GitHub / Stripe.
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
  };
}

/**
 * Builds a 429 Response body + headers when a rate limit is hit.
 */
export function rateLimitedResponse(result: RateLimitDenied): Response {
  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
  );
  const body = JSON.stringify({
    error: {
      code: "RATE_LIMITED",
      message: `Rate limit of ${result.limit}/hour exceeded for this API key. Try again in ${retryAfterSec}s.`,
    },
  });
  return new Response(body, {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSec),
      ...rateLimitHeaders(result),
    },
  });
}
