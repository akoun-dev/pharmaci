/**
 * Next.js Middleware for PharmApp CI API route protection.
 * Uses jose (Edge-compatible) to verify JWT tokens stored in cookies.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'pharmapp-session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pharmapp-ci-dev-secret-key-2025'
);

function getToken(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value ?? null;
}

function unauthorized(message = 'Authentification requise') {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 });
}

function forbidden(message = 'Accès refusé') {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 });
}

function authenticatedNext(userId: string, userRole: string): NextResponse {
  const res = NextResponse.next();
  res.headers.set('X-User-Id', userId);
  res.headers.set('X-User-Role', userRole);
  return res;
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
  if (!token) return unauthorized('Session non trouvée.');

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, JWT_SECRET);
    payload = result.payload as Record<string, unknown>;
  } catch {
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
