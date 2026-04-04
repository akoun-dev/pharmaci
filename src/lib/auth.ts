/**
 * JWT Authentication utility for Pharma CI.
 * Uses jose (Edge-compatible) with HS256 for session management.
 */
import { logger } from '@/lib/logger';
import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { cookies } from 'next/headers';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required but not set');
  }
  return new TextEncoder().encode(secret);
}

const COOKIE_NAME = 'pharmapp-session';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  provider: string;
}

/** Sign a JWT token with HS256, expires in 7 days */
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

/** Verify a JWT token and return payload, or null if invalid */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      provider: (payload.provider as string) || 'email',
    };
  } catch {
    return null;
  }
}

/** Extract token from the session cookie in a Request object */
export async function getSessionFromCookie(request: Request): Promise<JwtPayload | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookiesList = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookiesList.find(c => c.startsWith(`${COOKIE_NAME}=`));
  if (!sessionCookie) return null;

  const token = sessionCookie.split('=').slice(1).join('=');
  return verifyToken(token);
}

/** Create a session cookie response header value */
export function createSessionCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; ${
    isProduction ? 'Secure; ' : ''
  }SameSite=Lax; Max-Age=${maxAge}`;
}

/** Delete the session cookie */
export function deleteSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`;
}

/** Hash a password using bcryptjs */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

/** Verify a password against a bcryptjs hash */
export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  return compare(password, hashStr);
}

export { COOKIE_NAME };
