import { vi, beforeAll, beforeEach } from "vitest";
import { NextResponse } from "./__mocks__/next-server";

// Provide a test JWT secret so @/lib/auth can be imported in tests. The
// signing path is not exercised here (getCurrentUser is mocked), but the
// module-level secret check in auth.ts runs at import time.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-not-used-in-real-signing-0123456789";
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./db/custom.db";

// --- Mock @/lib/auth: keep pure helpers real, only stub the session layer ---
export const mockGetCurrentUser = vi.fn<() => Promise<unknown>>(async () => null);

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    getCurrentUser: mockGetCurrentUser,
    // The route guards close over the REAL getCurrentUser binding, so simply
    // overriding the export isn't enough — re-implement them on top of the
    // mocked getCurrentUser. The test auth user carries its `pharmacy.id`
    // directly (see setPharmacistAuth), so the pharmacy can be resolved without
    // hitting the (mock) db.
    requireRole: async (role: "PHARMACIST" | "ADMIN") => {
      const user = (await mockGetCurrentUser()) as { role?: string } | null;
      if (!user) {
        return { ok: false, error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
      }
      if (user.role !== role) {
        return { ok: false, error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
      }
      return { ok: true, user };
    },
    requirePharmacistWithPharmacy: async () => {
      const user = (await mockGetCurrentUser()) as {
        role?: string;
        pharmacy?: { id: string } | null;
      } | null;
      if (!user) {
        return { ok: false, error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
      }
      if (user.role !== "PHARMACIST") {
        return { ok: false, error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
      }
      const pharmacyId = user.pharmacy?.id;
      if (!pharmacyId) {
        return { ok: false, error: NextResponse.json({ error: "Aucune pharmacie associée à ce compte" }, { status: 403 }) };
      }
      return { ok: true, auth: { user, pharmacyId } };
    },
  };
});

// --- Mock @/lib/db: route handlers under test use the in-memory store ---
vi.mock("@/lib/db", async () => {
  const mod = await import("./__mocks__/db");
  return { db: mod.db };
});

// --- Seed deterministic test data before each API test ---
// Each test starts from a clean, predictable store so writes in one test
// (POST/PUT/DELETE) can't corrupt another.
import { seedTestData } from "./__mocks__/db";
beforeAll(() => {
  seedTestData();
});
beforeEach(() => {
  seedTestData();
  mockGetCurrentUser.mockReset();
  mockGetCurrentUser.mockResolvedValue(null);
});

// Mock fetch globally
globalThis.fetch = vi.fn() as unknown as typeof fetch;

// Mock navigator
Object.defineProperty(globalThis, "navigator", {
  value: {
    vibrate: vi.fn(),
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
    geolocation: {
      getCurrentPosition: vi.fn(),
    },
  },
  writable: true,
});

// Mock URL.createObjectURL and URL.revokeObjectURL
globalThis.URL.createObjectURL = vi.fn(() => "blob:test") as unknown as typeof URL.createObjectURL;
globalThis.URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;

// Mock localStorage for zustand persist middleware
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});
