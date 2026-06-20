# Task 4-a: AUTH API Routes

**Agent:** Backend Developer
**Task ID:** 4-a
**Date:** 2026

## Summary
Built all 6 authentication API route handlers for the PHARMACI application.

## Files Created

1. `src/app/api/auth/register/route.ts` — POST, public
   - Zod validation: name (min 2), email, password (min 6), phone?, role? (PATIENT|PHARMACIST, default PATIENT)
   - Checks for existing email → 409
   - Hashes password, creates user, creates token, sets cookie
   - Returns stripped user object (no password) with status 201

2. `src/app/api/auth/login/route.ts` — POST, public
   - Zod validation: email, password
   - Finds user by email (case-insensitive, lowercased), verifies password
   - Returns French 401 "Email ou mot de passe incorrect" on failure
   - Sets cookie, returns user with city/district/address

3. `src/app/api/auth/me/route.ts` — GET, auth required
   - Uses `getCurrentUser()` (which already includes pharmacy relation)
   - Returns user profile + `pharmacy` field if role === "PHARMACIST"
   - 401 if not authenticated

4. `src/app/api/auth/logout/route.ts` — POST, public
   - Clears auth cookie via `clearAuthCookie()`
   - Returns `{ success: true }`

5. `src/app/api/auth/update-profile/route.ts` — PUT, auth required
   - Zod validation: name?, phone?, address?, city?, district? (all optional, nullable)
   - Only updates provided fields
   - Returns updated user (without password)

6. `src/app/api/auth/change-password/route.ts` — PUT, auth required
   - Zod validation: currentPassword (required), newPassword (min 6)
   - Verifies current password → 400 "Le mot de passe actuel est incorrect" if invalid
   - Hashes and saves new password

## Code Patterns Used
- `import { NextRequest, NextResponse } from "next/server"`
- `import { z } from "zod"` for validation
- `requireAuth()` helper pattern (in me, update-profile, change-password)
- French error messages throughout
- Proper HTTP status codes: 200/201 (success), 400 (bad request), 401 (unauth), 409 (conflict), 500 (server error)
- All files are server-side only (no 'use client')

## Verification
- `bun run lint` passes with no errors
- Manual curl tests on dev server (port 3000) all returned correct status codes:
  - register (empty body) → 400 ✓
  - login (empty body) → 400 ✓
  - me (no cookie) → 401 ✓
  - logout → 200 ✓
  - update-profile (no cookie) → 401 ✓
  - change-password (no cookie) → 401 ✓
  - login with correct credentials (patient@pharmaci.ci/patient123) → 200 with full user object ✓
  - login with wrong password → 401 ✓

## Notes for Next Agents
- The `getCurrentUser()` helper in `src/lib/auth.ts` already includes the `pharmacy` relation, so `me` endpoint can simply check `user.role === "PHARMACIST" && user.pharmacy`.
- Email is stored/compared as lowercase — make sure other endpoints do the same for consistency.
- The `SessionUser` type does not include `city`/`district`/`address`/`avatarUrl` (JWT only carries id/email/name/role/phone). For full profile data, always re-fetch from DB via `getCurrentUser()`.
- Token cookie name: `pharmaci-token`, expiry: 7 days, httpOnly, sameSite=lax.
- Demo accounts available: patient@pharmaci.ci/patient123, pharmacien@pharmaci.ci/pharma123, admin@pharmaci.ci/admin123.
