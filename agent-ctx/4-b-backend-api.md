# Task 4-b — Backend API Routes (Medications, Pharmacies, Stocks)

**Agent:** Backend API Builder
**Task ID:** 4-b
**Date:** 2026-06-20

## Summary

Built all medications, pharmacies, stocks, reviews, favorites, and categories API routes for the PHARMACI app. All routes follow Next.js 16 App Router conventions (`params: Promise<{...}>`), use Zod for input validation, French error messages, and proper Prisma queries compatible with SQLite (no `mode: 'insensitive'`).

## Files Created (10 route files)

1. **`src/app/api/medications/route.ts`**
   - `GET` (public): paginated list with `search` (name/activeIngredient `contains`), `category` exact-match filter, `page`/`limit` pagination. Returns `{ medications, total, page, totalPages }`.
   - `POST` (ADMIN only via `getCurrentUser()` role check): creates medication. Zod-validated body (name, activeIngredient, category, dosage, form, description, prescriptionRequired, sideEffects, contraindications, optional imageUrl).

2. **`src/app/api/medications/[id]/route.ts`**
   - `GET` (public): single medication full details or 404 if not found.

3. **`src/app/api/medications/[id]/pharmacies/route.ts`**
   - `GET` (public): all pharmacies stocking the medication, with `price`, `stock`, `lowStockThreshold`, `expiryDate`, and `distance: null` placeholder. Sorted via `?sort=price|distance|rating` (default `price`). Returns `{ medication, pharmacies, total }`.

4. **`src/app/api/medications/categories/route.ts`**
   - `GET` (public): distinct non-empty categories, sorted alphabetically. Returns `{ categories: string[] }`.
   - Note: Next.js static route resolution correctly serves this over `[id]` dynamic route when path is `/api/medications/categories`.

5. **`src/app/api/pharmacies/route.ts`**
   - `GET` (public): paginated list with `search` (name/address contains), `city`, `district`, `onGuard=true|false`, `open24h=true|false`, `service` (CSV contains). Ordered by isOnGuard desc → rating desc → name asc. Returns `{ pharmacies, total, page, totalPages }`.
   - `POST` (PHARMACIST or ADMIN): creates pharmacy linked to current user as owner. Returns 400 if user already owns a pharmacy. Zod-validated body (name, address, city, district, lat/lng, phone, email, openingTime, closingTime, isOpen24h, isOnGuard, imageUrl, services, payments).

6. **`src/app/api/pharmacies/[id]/route.ts`**
   - `GET` (public): pharmacy with all details, includes `medications` (PharmacyMedication + medication details) and `reviews` (with user id/name/avatarUrl). Owner object excluded from response. 404 if not found.

7. **`src/app/api/pharmacies/[id]/medications/route.ts`**
   - `GET` (public): pharmacy stock list with medication details, price, stock, lowStockThreshold, expiryDate. Supports `?search=...` (filters medication name/activeIngredient in JS) and `?inStock=true|false`. Returns `{ pharmacy, medications, total }`.

8. **`src/app/api/pharmacies/[id]/reviews/route.ts`**
   - `GET` (public): list reviews for pharmacy, newest first, with user id/name/avatarUrl. Returns `{ pharmacy, reviews, total }`.
   - `POST` (PATIENT only): create review with rating 1-5 + comment. Unique constraint `[userId, pharmacyId]` handled via `Prisma.PrismaClientKnownRequestError` P2002 → 409. After creation, recomputes pharmacy.rating (rounded to 1 decimal) and pharmacy.reviewCount via `aggregate`.

9. **`src/app/api/pharmacies/[id]/favorite/route.ts`**
   - `GET` (auth): returns `{ isFavorite: boolean }`.
   - `POST` (auth): adds to favorites. P2002 unique violation → returns `{ isFavorite: true, message: "Pharmacie déjà en favori" }` (idempotent).
   - `DELETE` (auth): removes from favorites via `deleteMany` (idempotent). Returns `{ isFavorite: false }`.

10. **`src/app/api/favorites/route.ts`**
    - `GET` (auth): returns current user's favorite pharmacies with `favoriteId`, `favoritedAt`, and full pharmacy data. Returns `{ pharmacies, total }`.

## Code style & conventions

- `import { NextRequest, NextResponse } from "next/server"` everywhere.
- All `params` typed as `Promise<{ id: string }>` and awaited.
- Zod validation on every POST.
- French error messages throughout (`"Authentification requise"`, `"Pharmacie introuvable"`, etc.).
- Helper `requireAuth()` returns user or null.
- SQLite-safe: only `contains` (no `mode: 'insensitive'` since SQLite doesn't support it; ASCII case-insensitivity is built-in).
- Error logging via `console.error("[METHOD /path] Erreur:", error)`.
- Each POST properly checks role-based access (PATIENT for reviews, PHARMACIST/ADMIN for pharmacy creation, ADMIN for medication creation).

## Verification

- `bun run lint` → **PASS** (no errors, no warnings).
- `bunx tsc --noEmit` → no errors in any `src/app/api/**` file (errors only exist in unrelated files: `examples/websocket/*`, `prisma/seed.ts`, `skills/*`).
- Manual smoke tests via curl confirmed:
  - `/api/medications/categories` → 7 categories returned.
  - `/api/medications?search=Amoxicilline&limit=5` → correct search hit.
  - `/api/medications?category=Antibiotiques&limit=2` → filtered correctly.
  - `/api/medications/{id}/pharmacies` → pharmacies with stock sorted by price.
  - `/api/pharmacies?limit=2` → paginated pharmacies.
  - `/api/pharmacies/{id}/reviews` → reviews with user info, newest first.
  - `/api/pharmacies/{id}/medications?inStock=true` → in-stock meds only.
  - `/api/favorites` (no auth) → 401 with French message.

## Issues encountered

- Initial Write attempt failed for `medications/route.ts` because parent directory `src/app/api/medications` didn't exist yet. Fixed by `mkdir -p` for all required subdirectories (including the `[id]` literal directory names with brackets).
- The seed data uses accented French names like "Paracétamol" — the SQLite `contains` search is case-insensitive for ASCII but treats accented chars distinctly. Search works for ASCII-compatible queries (e.g. "Amoxicilline", "Ibuprofene"). This matches the task's spec ("use `contains` directly without mode"). No code change needed — accent normalization would be a separate concern.

## Status: COMPLETE ✅
