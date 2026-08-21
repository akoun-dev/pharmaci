import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/pharmacist/stats/route";
import { createGetRequest, setPharmacistAuth, setNoAuth, setPatientAuth, parseResponse } from "./helpers";

describe("GET /api/pharmacist/stats", () => {
  it("returns 401 when user is not authenticated", async () => {
    setNoAuth();
    const req = createGetRequest("/api/pharmacist/stats");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe("Non authentifié");
  });

  it("returns 403 when user is a patient", async () => {
    setPatientAuth();
    const req = createGetRequest("/api/pharmacist/stats");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(403);
  });

  it("returns stats for an authenticated pharmacist", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stats?period=all");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(200);

    const body = res.body as Record<string, unknown>;
    expect(body.pharmacyName).toBe("Pharmacie Centrale");
    expect(body.orders).toBeDefined();
    expect(body.revenue).toBeDefined();
    expect(body.monthlyRevenue).toBeDefined();
    expect(body.stock).toBeDefined();
    expect(body.reviews).toBeDefined();
    expect(body.recentOrders).toBeDefined();
  });

  it("returns correct order counts", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stats?period=all");
    const res = parseResponse(await GET(req));
    const body = res.body as { orders: { total: number; pending: number; confirmed: number; ready: number; pickedUp: number; cancelled: number } };

    expect(body.orders.total).toBeGreaterThanOrEqual(2);
    expect(body.orders.pending).toBeGreaterThanOrEqual(1);
    expect(body.orders.confirmed).toBeGreaterThanOrEqual(1);
  });

  it("returns correct stock counts", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stats?period=all");
    const res = parseResponse(await GET(req));
    const body = res.body as { stock: { totalItems: number; lowStock: number; inStock: number } };

    expect(body.stock.totalItems).toBe(3);
    expect(body.stock.inStock).toBeGreaterThanOrEqual(1);
    // stock-2 has stock=5, threshold=10 -> low stock
    // stock-3 has stock=0, threshold=5 -> low stock
    expect(body.stock.lowStock).toBeGreaterThanOrEqual(1);
  });

  it("returns reviews with average rating", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stats?period=all");
    const res = parseResponse(await GET(req));
    const body = res.body as { reviews: { total: number; average: number } };

    expect(body.reviews.total).toBe(1);
    expect(body.reviews.average).toBe(5);
  });

  it("returns revenue data", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stats?period=all");
    const res = parseResponse(await GET(req));
    const body = res.body as { revenue: number; monthlyRevenue: Array<{ month: string; revenue: number }> };

    expect(body.revenue).toBeGreaterThan(0);
    expect(body.monthlyRevenue.length).toBe(6);
    expect(body.monthlyRevenue[0]).toHaveProperty("month");
    expect(body.monthlyRevenue[0]).toHaveProperty("revenue");
  });

  it("filters revenue by period", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stats?period=month");
    const res = parseResponse(await GET(req));
    const body = res.body as { revenueMonth: number; monthlyRevenue: Array<{ month: string; revenue: number }> };

    expect(body.monthlyRevenue.length).toBe(6);
    expect(typeof body.revenueMonth).toBe("number");
  });
});
