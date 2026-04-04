import { logger } from './logger';
import { NextResponse } from 'next/server';

/**
 * Rate limit storage interface
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limit storage
 * For production, use Redis or a database
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom key generator (default: IP-based) */
  keyGenerator?: (request: Request) => string;
  /** Skip rate limiting for certain conditions */
  skip?: (request: Request) => boolean;
  /** Handler when rate limit is exceeded */
  onLimitReached?: (key: string, limit: number) => void;
}

/**
 * Default rate limit configurations
 */
export const RateLimits = {
  /** Strict rate limit for authentication endpoints */
  auth: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  } as RateLimitOptions,

  /** Moderate rate limit for API routes */
  api: {
    limit: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  } as RateLimitOptions,

  /** Lenient rate limit for public endpoints */
  public: {
    limit: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
  } as RateLimitOptions,
};

/**
 * Extract client IP from request
 */
function getClientIp(request: Request): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a hash of the request
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Rate limit middleware
 */
export function rateLimit(options: RateLimitOptions) {
  return async function checkRateLimit(request: Request): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    resetAt: Date;
    error?: string;
  }> {
    // Skip if configured
    if (options.skip?.(request)) {
      return {
        success: true,
        limit: options.limit,
        remaining: options.limit,
        resetAt: new Date(Date.now() + options.windowMs),
      };
    }

    // Generate key
    const key = options.keyGenerator
      ? options.keyGenerator(request)
      : `ratelimit:${getClientIp(request)}:${request.url}`;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Check if window has expired
    if (!entry || entry.resetAt < now) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + options.windowMs,
      };
      rateLimitStore.set(key, newEntry);

      return {
        success: true,
        limit: options.limit,
        remaining: options.limit - 1,
        resetAt: new Date(newEntry.resetAt),
      };
    }

    // Check if limit exceeded
    if (entry.count >= options.limit) {
      options.onLimitReached?.(key, options.limit);

      logger.warn('Rate limit exceeded', {
        key,
        limit: options.limit,
        count: entry.count,
        url: request.url,
      });

      return {
        success: false,
        limit: options.limit,
        remaining: 0,
        resetAt: new Date(entry.resetAt),
        error: `Trop de requêtes. Réessayez après ${new Date(entry.resetAt).toLocaleTimeString('fr-FR')}.`,
      };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - entry.count,
      resetAt: new Date(entry.resetAt),
    };
  };
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function withRateLimit<T>(
  handler: (request: Request) => Promise<NextResponse>,
  options: RateLimitOptions
): (request: Request) => Promise<NextResponse> {
  return async function rateLimitedHandler(request: Request) {
    const result = await rateLimit(options)(request);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Trop de requêtes',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toISOString(),
            'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = await handler(request);

    // Add rate limit headers to successful response
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

    return response;
  };
}

/**
 * Get rate limit info for a key
 */
export function getRateLimitInfo(key: string): { count: number; resetAt: Date } | null {
  const entry = rateLimitStore.get(key);
  if (!entry) return null;

  return {
    count: entry.count,
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Reset rate limit for a key (admin function)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (admin function)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
