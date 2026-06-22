# PHARMACI - Worklog

Project: Application de recherche de médicaments et de pharmacies pour la Côte d'Ivoire
Stack: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite), jose (JWT), bcryptjs, leaflet, qrcode

---
Task ID: 1
Agent: Main (orchestrator)
Task: Project setup - install dependencies, Prisma schema, auth library, seed data

Work Log:
- Analyzed 6 design reference images using VLM (login, dashboard, pharmacy list, map view, profile edit, navigation)
- Identified design system: primary green (#00A651 / #2E7D32), light blue (#E3F2FD), minimalist mobile-first
- Installed dependencies: bcryptjs, jose, qrcode, leaflet, react-leaflet (+ types)
- Created comprehensive Prisma schema with models: User, Pharmacy, Medication, PharmacyMedication, Order, OrderItem, Review, Favorite, Message, StockHistory
- Created auth library at src/lib/auth.ts with JWT (jose), bcrypt password hashing, session management via cookies, order code generation
- Created seed script at prisma/seed.ts with:
  - 3 demo users (patient@pharmaci.ci/patient123, pharmacien@pharmaci.ci/pharma123, admin@pharmaci.ci/admin123)
  - 10 additional patient users for reviews
  - 8 pharmacies across Abidjan (Cocody, Plateau, Yopougon, Marcory, Treichville, Abobo)
  - 12 medications (antalgiques, antibiotiques, antipaludéens, vitamines, etc.)
  - Stock entries for each pharmacy-medication pair with prices in FCFA
  - Reviews and ratings for pharmacies
  - 3 sample orders with different statuses (READY, CONFIRMED, PICKED_UP)
- Pushed schema and seeded database successfully

Stage Summary:
- Foundation complete. Database ready with realistic Côte d'Ivoire data.
- Auth library provides: hashPassword, verifyPassword, createToken, verifyToken, getSession, setAuthCookie, clearAuthCookie, getCurrentUser, generateOrderCode
- Ready for backend API routes and frontend development.

---
Task ID: 4-a
Agent: Backend Developer
Task: Build AUTH API routes (register, login, me, logout, update-profile, change-password)

Work Log:
- Reviewed worklog.md, src/lib/auth.ts, and prisma/schema.prisma for context
- Created 6 route handlers under src/app/api/auth/:
  1. register/route.ts (POST) — Zod validation, email uniqueness check (409), password hash, token+cookie, returns stripped user with 201
  2. login/route.ts (POST) — Zod validation, finds user by email (lowercased), verifies password, French 401 message "Email ou mot de passe incorrect", returns user with city/district/address
  3. me/route.ts (GET) — uses getCurrentUser() (which already includes pharmacy relation), returns user profile + pharmacy if PHARMACIST role, 401 if unauth
  4. logout/route.ts (POST) — clears auth cookie, returns { success: true }
  5. update-profile/route.ts (PUT) — Zod-validated optional fields (name/phone/address/city/district), only updates provided fields, returns updated user without password
  6. change-password/route.ts (PUT) — verifies currentPassword, hashes newPassword, 400 if current invalid
- Used requireAuth() helper pattern in protected routes
- All files use NextRequest/NextResponse, zod validation, French error messages, proper status codes (200/201/400/401/409/500)
- All files are server-side only (no 'use client')

Verification:
- bun run lint passes with no errors
- Manual curl tests on dev server (port 3000):
  - register (empty body) → 400 ✓
  - login (empty body) → 400 ✓
  - me (no cookie) → 401 ✓
  - logout → 200 ✓
  - update-profile (no cookie) → 401 ✓
  - change-password (no cookie) → 401 ✓
  - login with patient@pharmaci.ci/patient123 → 200 with full user object (id, name, email, role, phone, city, district, address) ✓
  - login with wrong password → 401 ✓

Stage Summary:
- AUTH API is fully functional and ready for the frontend to consume.
- Endpoints return the documented response shapes consistently.
- Demo accounts all work for testing (patient/pharmacien/admin @pharmaci.ci).
- Next agents can build frontend auth UI (login form, register form, profile page) on top of these endpoints.

---
Task ID: 4-c
Agent: Backend (orders API)
Task: Build the ORDERS API routes

Files Created:
- src/app/api/orders/route.ts (GET list by role + POST create order - PATIENT)
- src/app/api/orders/[id]/route.ts (GET single + PUT update status)
- src/app/api/orders/[id]/cancel/route.ts (POST cancel by patient)
- src/app/api/orders/code/[code]/route.ts (GET by code - pharmacist/admin)

Key Implementation Details:
- Role-based listing: PATIENT (own orders), PHARMACIST (orders for pharmacy owned via ownerId), ADMIN (all)
- Order creation in db.$transaction: re-check stock, create order + items, decrement stock atomically
- Order code generation via generateOrderCode() with retry-on-collision (max 5 attempts)
- Stock restoration on cancel (both via PUT status=CANCELLED and via /cancel route)
- Status transition validation: PENDING→CONFIRMED, CONFIRMED→READY, READY→PICKED_UP, PENDING|CONFIRMED→CANCELLED
- Zod validation, French error messages, Next.js 16 async params pattern
- Work record saved to agent-ctx/4-c-orders-api.md

Verification:
- bun run lint → exit code 0, no errors
- Dev server running normally on port 3000

Issues: None

---
Task ID: 4-b
Agent: Backend API Builder
Task: Build MEDICATIONS, PHARMACIES, and STOCKS API routes

Work Log:
- Read existing project context (Prisma schema, auth library, worklog from task 1)
- Created 10 API route files under `src/app/api/`:
  1. `medications/route.ts` — GET (public, paginated search+category filter) + POST (ADMIN only, Zod validation)
  2. `medications/[id]/route.ts` — GET single medication (public)
  3. `medications/[id]/pharmacies/route.ts` — GET pharmacies stocking this med, sorted by price/distance/rating
  4. `medications/categories/route.ts` — GET distinct categories (public, static route beats [id])
  5. `pharmacies/route.ts` — GET (public, search/city/district/onGuard/open24h/service filters) + POST (PHARMACIST/ADMIN, prevents duplicate pharmacy per owner)
  6. `pharmacies/[id]/route.ts` — GET pharmacy with medications + reviews + user info (public)
  7. `pharmacies/[id]/medications/route.ts` — GET stock list with ?search and ?inStock filters (public)
  8. `pharmacies/[id]/reviews/route.ts` — GET reviews newest-first (public) + POST (PATIENT only, P2002 unique → 409, recomputes pharmacy.rating & reviewCount)
  9. `pharmacies/[id]/favorite/route.ts` — GET isFavorite / POST add (idempotent on P2002) / DELETE remove (idempotent) — all auth required
  10. `favorites/route.ts` — GET current user's favorite pharmacies (auth required)
- All routes use Next.js 16 conventions: `params: Promise<{id}>` awaited, `NextRequest`/`NextResponse`, Zod validation, French error messages, `requireAuth()` helper, SQLite-safe `contains` queries (no `mode:'insensitive'`).
- Role-based access enforced: ADMIN for medication creation, PHARMACIST/ADMIN for pharmacy creation, PATIENT for reviews.
- Verification:
  - `bun run lint` → PASS (no errors)
  - `bunx tsc --noEmit` → no errors in any `src/app/api/**` file
  - Smoke-tested 8 endpoints via curl, all returned correct JSON / status codes (401 for unauthenticated favorites, 404 logic, etc.)

Stage Summary:
- All medications, pharmacies, stocks, reviews, favorites, and categories API endpoints are functional and lint-clean.
- Frontend agents can now consume these endpoints to build the medication search UI, pharmacy list/detail pages, map view, favorites, and reviews.
- Detailed work record: `/home/z/my-project/agent-ctx/4-b-backend-api.md`

---
Task ID: 7-15
Agent: Main (orchestrator)
Task: Build the complete frontend for PHARMACI patient space and authentication

Work Log:
- Created green-themed design system (globals.css) matching the reference mockups (#16a34a primary green, light blue accents, minimalist mobile-first)
- Updated layout.tsx with PHARMACI metadata, French language, Leaflet CSS import, and mobile viewport
- Created Zustand store (src/lib/store.ts) with: auth state, client-side navigation (tab/view/params/history stack), cart management, recent searches, toast queue - all persisted except navigation
- Created API client (src/lib/api.ts) with typed wrappers for all auth, medication, pharmacy, order endpoints + utility functions (formatFCFA, formatDate, haversineDistance, ORDER_STATUS)
- Built app shell (app-shell.tsx) with: session boot check, mobile container (max-w-md), dynamic MapScreen import (ssr:false for Leaflet), screen router, bottom navigation
- Built auth screen matching design: logo, email/password fields with icons, show/hide password, social login buttons (Google/Facebook), demo credentials helper, login/register toggle
- Built home screen: greeting, Médicaments/Pharmacies mode tabs, search bar, category chips, help banner, location card, pharmacies de garde list, medications populaires carousel
- Built medication search screen: search bar, category filters, result list with medication cards
- Built medication detail screen: header card, description, side effects/contraindications warnings, pharmacy list with prices sorted by price/rating, add to cart
- Built pharmacy search screen: search bar, filter chips (Ouvert/Garde/Vaccination), pharmacy cards
- Built guard pharmacies screen: full list of pharmacies de garde
- Built pharmacy detail screen: hero image, info card (address/hours/phone), services badges, payment methods, action buttons (Itinéraire/Appeler), stock search, medication list with add to cart, reviews with add review modal, favorite toggle
- Built map screen: Leaflet map with custom green pharmacy markers, user location marker, guard-only filter switch, locate button, selected pharmacy overlay card
- Built orders screen: cart summary banner, status filter tabs, order cards with status badges and codes
- Built cart screen: items grouped by pharmacy, quantity controls, remove, total
- Built checkout screen: order summary by pharmacy, notes field, confirm button
- Built order detail screen: 4-step status timeline, verification code with copy, QR code modal (generated via qrcode lib), pharmacy info card, items list, cancel button
- Built profile screen: avatar, user info, favorites list, account menu, logout
- Built edit profile screen: avatar, form (name/email/phone/district/city/address), security note, save button
- Built change password screen: current/new/confirm password fields with show/hide toggles

Verification (Agent Browser):
- Fixed SSR crash: react-leaflet references `window` at module load → dynamically imported MapScreen with next/dynamic ssr:false
- Fixed API response shape mismatches: medications/[id] returns medication directly (not wrapped), pharmacies/[id] returns pharmacy directly (not wrapped), medications/[id]/pharmacies returns items with nested `pharmacy` field, favorites returns `{ pharmacies }` not `{ favorites }`
- All screens verified working: auth login, home, medication search/detail, pharmacy search/detail, guard pharmacies, map, orders list, order detail with QR code, profile, edit profile
- Lint passes with 0 errors
- All API endpoints return 200

Stage Summary:
- Complete patient space and authentication implemented and browser-verified
- Mobile-first design matching the 6 reference mockups (green theme, minimalist, French)
- Demo accounts: patient@pharmaci.ci/patient123, pharmacien@pharmaci.ci/pharma123, admin@pharmaci.ci/admin123
- All key features working: JWT auth, medication/pharmacy search, interactive Leaflet map, cart/checkout with QR codes, order tracking, pharmacy reviews, favorites, profile management
