import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/pharmacist/stock/history/route";
import { createGetRequest, setPharmacistAuth, setNoAuth, parseResponse } from "./helpers";

describe("GET /api/pharmacist/stock/history", () => {
  it("returns 403 when not authenticated", async () => {
    setNoAuth();
    const req = createGetRequest("/api/pharmacist/stock/history?medicationId=med-1");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(403);
  });

  it("returns 400 when medicationId is missing", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock/history");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(400);
    const body = res.body as { error: string };
    expect(body.error).toContain("medicationId");
  });

  it("returns history for a medication that has history records", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock/history?medicationId=med-1");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(200);

    const body = res.body as { history: Array<{ id: string; changeType: string; quantity: number }> };
    expect(body.history).toBeDefined();
    expect(Array.isArray(body.history)).toBe(true);
    expect(body.history.length).toBeGreaterThanOrEqual(1);
    expect(body.history[0].changeType).toBe("ADD");
    expect(body.history[0].quantity).toBe(50);
  });

  it("returns empty array for a medication without history", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock/history?medicationId=med-nonexistent");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(200);

    const body = res.body as { history: unknown[] };
    expect(Array.isArray(body.history)).toBe(true);
    expect(body.history.length).toBe(0);
  });

  it("limits history to 50 entries", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock/history?medicationId=med-1");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(200);

    const body = res.body as { history: unknown[] };
    expect(body.history.length).toBeLessThanOrEqual(50);
  });

  it("returns history sorted by createdAt descending", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock/history?medicationId=med-1");
    const res = parseResponse(await GET(req));
    const body = res.body as { history: Array<{ createdAt: string }> };

    // Check they're sorted newest first
    for (let i = 1; i < body.history.length; i++) {
      const prev = new Date(body.history[i - 1].createdAt).getTime();
      const curr = new Date(body.history[i].createdAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});
