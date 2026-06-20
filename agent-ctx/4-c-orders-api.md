# Task 4-c: Orders API Routes

Agent: Backend (orders API)
Task: Build the ORDERS API routes for the PHARMACI application

## Files Created

1. `src/app/api/orders/route.ts`
   - **GET**: List current user's orders filtered by role
     - PATIENT → their orders
     - PHARMACIST → orders for their pharmacy (looked up via `ownerId = user.id`)
     - ADMIN → all orders
     - Supports `?status=PENDING|CONFIRMED|READY|PICKED_UP|CANCELLED` filter
     - Includes pharmacy, items with medication, and user (name/phone/email)
     - Sorted by `createdAt` desc
   - **POST**: Create order (PATIENT only)
     - Validates pharmacy exists, each medication is in stock at that pharmacy
     - Stock > 0, quantity > 0, stock >= quantity
     - Generates order code via `generateOrderCode()` with retry-on-collision (max 5 attempts)
     - Uses `db.$transaction` to atomically: re-check stock, create order + items, decrement stock
     - Returns 201 with created order including items and pharmacy

2. `src/app/api/orders/[id]/route.ts`
   - **GET**: Single order detail with items, pharmacy, user
     - Access control: owner OR pharmacist of that pharmacy (via `ownerId`) OR admin
   - **PUT**: Update order status (PHARMACIST of the pharmacy OR ADMIN)
     - Body: `{ status }` ∈ {CONFIRMED, READY, PICKED_UP, CANCELLED}
     - Validates allowed transitions: PENDING→CONFIRMED, CONFIRMED→READY, READY→PICKED_UP, PENDING|CONFIRMED→CANCELLED
     - On CANCELLED: restores stock (transaction with `increment`)

3. `src/app/api/orders/[id]/cancel/route.ts`
   - **POST** (PATIENT only)
     - Only if order belongs to user AND status ∈ {PENDING, CONFIRMED}
     - Sets status to CANCELLED and restores stock atomically

4. `src/app/api/orders/code/[code]/route.ts`
   - **GET** (PHARMACIST or ADMIN only)
     - Looks up order by code (normalized to uppercase)
     - For pharmacist: verifies the order belongs to their pharmacy
     - Returns order with items, user (name/phone/email), pharmacy
     - Used for QR-code-based verification at the pharmacy counter

## Implementation Notes

- Used `NextRequest` / `NextResponse` from `next/server`
- Used Zod v4 for request body & query validation
- French error messages throughout (e.g. "Non authentifié", "Pharmacie introuvable")
- Used `requireAuth()` helper returning the user or null
- All four files are server-side (no `'use client'`)
- Used `db.$transaction` for all stock modifications (decrement on create, increment on cancel)
- Used the unique compound key `pharmacyId_medicationId` for `PharmacyMedication` updates
- Next.js 16 async params pattern: `{ params }: { params: Promise<{ id: string }> }` with `await params`
- Re-checks stock inside the transaction to prevent race conditions on order creation
- The auth `getCurrentUser()` returns the full DB user record (with `pharmacy` relation included), but the code uses `user.id`, `user.role` which are common to both the SessionUser type and the DB record.

## Verification

- `bun run lint` → exit code 0, no errors / warnings
- Dev server is running normally on port 3000

## Issues Encountered

None. Lint passes on first attempt.
