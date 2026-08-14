import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory sliding-window rate limiter with automatic expiration.
 *
 * Suitable for a single-server deployment. For multi-instance production,
 * replace the store with Redis (or Upstash) keyed by identifier.
 *
 * Entries older than `windowMs` are pruned lazily on each check.
 * A cleanup interval removes stale entries to prevent memory leaks.
 */

interface Bucket {
  hits: number[];
  lastAccess: number;
}

const buckets = new Map<string, Bucket>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Cleanup every 5 minutes

// Start cleanup interval to prevent memory leaks
if (typeof globalThis !== "undefined" && !(globalThis as any).__rateLimitCleanup) {
  (globalThis as any).__rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    let deleted = 0;
    for (const [key, bucket] of buckets.entries()) {
      // Remove buckets that haven't been accessed in 2x the max window or are empty
      if (now - bucket.lastAccess > 2 * 60 * 60 * 1000 || bucket.hits.length === 0) {
        buckets.delete(key);
        deleted++;
      }
    }
    if (deleted > 0) {
      console.debug(`[RateLimit] Cleaned up ${deleted} stale buckets`);
    }
  }, CLEANUP_INTERVAL_MS);
  
  // Allow cleanup in tests
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    clearInterval((globalThis as any).__rateLimitCleanup);
    (globalThis as any).__rateLimitCleanup = null;
  }
}

function getClientKey(req: NextRequest): string {
  // Prefer the forwarded IP (behind Caddy), fall back to the raw remote.
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Enforce a rate limit. Returns `null` if the request is allowed, or a
 * `NextResponse` (429) to reject it.
 *
 * @param keyExtra extra keying (e.g. the email for login) to scope the limit
 */
export function rateLimit(
  req: NextRequest,
  opts: { limit: number; windowMs: number; keyExtra?: string }
): NextResponse | null {
  const ip = getClientKey(req);
  const key = opts.keyExtra ? `${ip}:${opts.keyExtra}` : ip;
  const now = Date.now();
  const cutoff = now - opts.windowMs;

  const existingBucket = buckets.get(key);
  const bucket = existingBucket ?? { hits: [], lastAccess: now };
  
  // Update last access time
  bucket.lastAccess = now;
  
  // Drop entries outside the window.
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= opts.limit) {
    return NextResponse.json(
      { error: "Trop de tentatives. Veuillez réessayer dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(opts.windowMs / 1000)) } }
    );
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return null;
}

/** Test helper: clear all rate-limit state. */
export function __resetRateLimit() {
  buckets.clear();
}
