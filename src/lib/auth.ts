import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
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
      isActive: true,
      createdAt: true,
      updatedAt: true,
      password: true, // needed by change-password; stripped from API responses by each route's select
      pharmacy: true,
    },
  });
  // A deleted/anonymized account keeps its row (for order/review history integrity)
  // but must never be usable again, even with a still-valid JWT.
  if (!user || !user.isActive) return null;
  return user;
}

// Thrown by deactivateUser() when the account can't be removed because it
// still owns a pharmacy that other users (patients, staff) depend on.
export class PharmacyOwnerDeletionError extends Error {}

// "Delete" an account without breaking referential integrity: orders,
// reviews, favorites and messages reference the user and must stay valid
// for history/audit purposes, so we anonymize the row and disable login
// instead of hard-deleting it.
export async function deactivateUser(userId: string) {
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { pharmacy: { select: { id: true, name: true } } },
  });
  if (target?.pharmacy) {
    throw new PharmacyOwnerDeletionError(
      `Impossible de supprimer ce compte : il possède la pharmacie « ${target.pharmacy.name} ». Réassignez ou supprimez d'abord cette pharmacie.`
    );
  }

  const unusablePassword = await hashPassword(`${randomUUID()}${randomUUID()}`);
  return db.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      email: `deleted-${userId}@pharmaci.invalid`,
      name: "Compte supprimé",
      phone: null,
      address: null,
      city: null,
      district: null,
      avatarUrl: null,
      password: unusablePassword,
    },
  });
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

// ---------- Route guards ----------
//
// Shared guards so every protected route returns consistent status codes:
//   - 401 when there is no session (lets the API client auto-logout, see
//     src/lib/api.ts — previously pharmacist/admin routes returned 403 on an
//     expired session, leaving the user stuck).
//   - 403 when the session is valid but the role doesn't match.
//
// They use a discriminated union (`ok`) so call sites can narrow cleanly:
//   const guard = await requirePharmacistWithPharmacy();
//   if (!guard.ok) return guard.error;   // guard.error is NextResponse here
//   const auth = guard.auth;

type GuardOk<T> = { ok: true } & T;
type GuardErr = { ok: false; error: NextResponse };

export async function requireRole(role: "PHARMACIST" | "ADMIN"): Promise<
  GuardOk<{ user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }> | GuardErr
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  if (user.role !== role) {
    return { ok: false, error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
  }
  return { ok: true, user };
}

// Pharmacist guard that also resolves the caller's pharmacy. Returns an
// `auth` object shaped like the old per-route helper ({ user, pharmacyId }) so
// existing call sites keep working.
export async function requirePharmacistWithPharmacy(): Promise<
  GuardOk<{ auth: { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; pharmacyId: string } }> | GuardErr
> {
  const roleGuard = await requireRole("PHARMACIST");
  if (!roleGuard.ok) return { ok: false, error: roleGuard.error };
  const pharmacy = await db.pharmacy.findUnique({
    where: { ownerId: roleGuard.user.id },
    select: { id: true },
  });
  if (!pharmacy) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Aucune pharmacie associée à ce compte" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, auth: { user: roleGuard.user, pharmacyId: pharmacy.id } };
}
