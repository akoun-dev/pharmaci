import { randomBytes, createHash, timingSafeEqual } from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-change-in-production';

/**
 * Generate a CSRF token for state-changing operations
 */
export function generateCSRFToken(sessionId: string): string {
  const tokenData = `${sessionId}-${Date.now()}-${randomBytes(CSRF_TOKEN_LENGTH).toString('hex')}`;
  const hash = createHash('sha256')
    .update(CSRF_SECRET)
    .update(tokenData)
    .digest('base64');
  return `${tokenData.substring(0, CSRF_TOKEN_LENGTH)}.${hash}`;
}

/**
 * Verify a CSRF token
 */
export function verifyCSRFToken(token: string, sessionId: string): boolean {
  if (!token || !sessionId) return false;

  try {
    const [tokenPrefix, hash] = token.split('.');
    if (!tokenPrefix || !hash || tokenPrefix.length !== CSRF_TOKEN_LENGTH) {
      return false;
    }

    // Recreate the expected hash
    const expectedHash = createHash('sha256')
      .update(CSRF_SECRET)
      .update(`${sessionId}-${tokenPrefix.substring(0, tokenPrefix.lastIndexOf('-'))}`)
      .digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  } catch {
    return false;
  }
}

/**
 * Extract CSRF token from request headers
 */
export function getCSRFTokenFromHeaders(request: Request): string | null {
  return request.headers.get('x-csrf-token') ||
         request.headers.get('x-xsrf-token') || // Angular style
         null;
}

/**
 * Middleware to verify CSRF for state-changing operations
 */
export function requireCSRF(request: Request, sessionId: string): { valid: boolean; error?: string } {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return { valid: true }; // CSRF not needed for safe methods
  }

  const token = getCSRFTokenFromHeaders(request);
  if (!token) {
    return { valid: false, error: 'CSRF token manquant' };
  }

  if (!verifyCSRFToken(token, sessionId)) {
    return { valid: false, error: 'CSRF token invalide' };
  }

  return { valid: true };
}

/**
 * Generate a CSRF token for a new session
 */
export function createSessionCSRFToken(sessionId: string): string {
  return generateCSRFToken(sessionId);
}
