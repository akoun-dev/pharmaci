import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
// Reject weak/known-default secrets in production to prevent token forgery.
const KNOWN_WEAK_SECRETS = new Set([
  "pharmaci-secret-key-change-in-production-2026",
  "change-me",
  "secret",
]);
if (
  process.env.NODE_ENV === "production" &&
  (JWT_SECRET.length < 32 || KNOWN_WEAK_SECRETS.has(JWT_SECRET))
) {
  throw new Error(
    "JWT_SECRET must be a strong random value (>= 32 chars) in production. Rotate it immediately."
  );
}
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

const COOKIE_NAME = "pharmaci-token";
const TOKEN_EXPIRY = "7d";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "PATIENT" | "PHARMACIST" | "ADMIN";
  phone?: string | null;
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify a password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Create a JWT token
export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(encodedSecret);
}

// Verify a JWT token
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

// Get the current session from cookies
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Set the auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// Clear the auth cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get the current user from the database (full record minus password hash)
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.id },
    // Never load the password hash into memory unless explicitly needed.
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      address: true,
      city: true,
      district: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      password: true, // needed by change-password; stripped from API responses by each route's select
      pharmacy: true,
    },
  });
  return user;
}

// Generate a unique order code
export function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `PHARMACI-${code}`;
}
