import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Suitable for a single-server deployment. For multi-instance production,
 * replace the store with Redis (or Upstash) keyed by identifier.
 *
 * Entries older than `windowMs` are pruned lazily on each check.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

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

  const bucket = buckets.get(key) ?? { hits: [] };
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
