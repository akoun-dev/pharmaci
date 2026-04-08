/**
 * Next.js Middleware for Pharma CI API route protection.
 * Uses jose (Edge-compatible) to verify JWT tokens stored in cookies.
 */
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'pharmaci-session';
const CSRF_COOKIE_NAME = 'pharmaci-csrf-token';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required but not set');
  }
  return new TextEncoder().encode(secret);
}

function getToken(request: NextRequest): string | null {
  // First try to get from cookie
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  // Fallback: try to get from Authorization header (Bearer token)
  // This is useful for IP access where cookies might not work properly
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

function getCSRFToken(request: NextRequest): string | null {
  // Check header first, then cookie
  return (request.headers.get('x-csrf-token') ||
          request.headers.get('x-xsrf-token') ||
          request.cookies.get(CSRF_COOKIE_NAME)?.value) ?? null;
}

function unauthorized(message = 'Authentification requise') {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 });
}

function forbidden(message = 'Accès refusé') {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 });
}

function csrfError(message = 'CSRF token invalide') {
  return NextResponse.json({ error: message, code: 'CSRF_INVALID' }, { status: 403 });
}

function authenticatedNext(userId: string, userRole: string): NextResponse {
  const res = NextResponse.next();
  res.headers.set('X-User-Id', userId);
  res.headers.set('X-User-Role', userRole);
  return res;
}

// Routes that require CSRF validation (state-changing operations)
function requiresCSRFValidation(pathname: string, method: string): boolean {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return false;
  
  // Skip CSRF for auth routes (login/register handle their own security)
  if (pathname.startsWith('/api/auth/')) return false;
  
  // All other state-changing operations require CSRF
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  if (pathname === '/api' || pathname.startsWith('/api/auth/')) return NextResponse.next();
  if (pathname === '/api/medications' && method === 'GET') return NextResponse.next();
  if (/^\/api\/medications\/[^/]+$/.test(pathname) && method === 'GET') return NextResponse.next();
  if (pathname === '/api/pharmacies' && method === 'GET') return NextResponse.next();
  if (/^\/api\/pharmacies\/[^/]+$/.test(pathname) && method === 'GET') return NextResponse.next();
  if (/^\/api\/pharmacies\/[^/]+\/medications$/.test(pathname) && method === 'GET') return NextResponse.next();
  // /api/orders GET now requires auth — handled by middleware below
  if (pathname === '/api/reviews' && method === 'GET') return NextResponse.next();

  const token = getToken(request);
  if (!token) {
    logger.warn('Middleware: No token found', { pathname, method, cookie: request.headers.get('cookie')?.substring(0, 100) });
    return unauthorized('Session non trouvée.');
  }

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, getJwtSecret());
    payload = result.payload as Record<string, unknown>;
  } catch (error) {
    logger.warn('Middleware: Invalid token', { pathname, method, error });
    return unauthorized('Session invalide ou expirée.');
  }

  const userId = String(payload.userId ?? '');
  const userRole = String(payload.role ?? '');

  if (pathname.startsWith('/api/admin/')) {
    if (userRole !== 'admin') return forbidden('Accès réservé aux administrateurs.');
    return authenticatedNext(userId, userRole);
  }

  if (pathname.startsWith('/api/pharmacist/')) {
    if (userRole !== 'pharmacist') return forbidden('Accès réservé aux pharmaciens.');
    return authenticatedNext(userId, userRole);
  }

  if (/^\/api\/pharmacies\/[^/]+\/stocks$/.test(pathname) && method === 'PUT') {
    if (userRole !== 'pharmacist') return forbidden('Seuls les pharmaciens peuvent modifier les stocks.');
    return authenticatedNext(userId, userRole);
  }

  if (pathname.startsWith('/api/users/')) return authenticatedNext(userId, userRole);
  if (pathname === '/api/orders') return authenticatedNext(userId, userRole);
  if (pathname === '/api/reviews' && method === 'POST') return authenticatedNext(userId, userRole);
  if (pathname === '/api/favorites') return authenticatedNext(userId, userRole);

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
