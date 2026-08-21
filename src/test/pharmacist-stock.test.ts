import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/pharmacist/stock/route";
import { createGetRequest, createPostRequest, setPharmacistAuth, setNoAuth, parseResponse } from "./helpers";

describe("GET /api/pharmacist/stock", () => {
  it("returns 401 when not authenticated", async () => {
    setNoAuth();
    const req = createGetRequest("/api/pharmacist/stock");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(401);
  });

  it("returns all stock items for the pharmacy", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(200);

    const body = res.body as { stocks: unknown[]; total: number };
    expect(body.stocks).toHaveLength(3);
    expect(body.total).toBe(3);
  });

  it("returns stock items with medication data", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock");
    const res = parseResponse(await GET(req));
    const body = res.body as { stocks: Array<{ medication: { name: string }; price: number; stock: number }> };

    expect(body.stocks[0].medication).toBeDefined();
    expect(body.stocks[0].medication.name).toBeDefined();
    expect(body.stocks[0].price).toBeGreaterThan(0);
    expect(body.stocks[0].stock).toBeGreaterThanOrEqual(0);
  });

  it("filters by search query", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock?search=Paracétamol");
    const res = parseResponse(await GET(req));
    const body = res.body as { stocks: Array<{ medication: { name: string } }>; total: number };

    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.stocks.some((s) => s.medication.name.includes("Paracétamol"))).toBe(true);
  });

  it("filters by low stock", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock?lowStock=true");
    const res = parseResponse(await GET(req));
    const body = res.body as { stocks: Array<{ stock: number; lowStockThreshold: number }>; total: number };

    expect(body.total).toBeGreaterThanOrEqual(1);
    body.stocks.forEach((s) => {
      expect(s.stock <= s.lowStockThreshold).toBe(true);
    });
  });

  it("filters by expiry (expiring soon)", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock?expiry=expiring");
    const res = parseResponse(await GET(req));
    const body = res.body as { stocks: Array<{ medication: { name: string } }>; total: number };

    // stock-2 has expiryDate 15 days from now
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it("filters by category", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock?category=Antibiotiques");
    const res = parseResponse(await GET(req));
    const body = res.body as { stocks: Array<{ medication: { category: string } }>; total: number };

    expect(body.total).toBeGreaterThanOrEqual(1);
    body.stocks.forEach((s) => {
      expect(s.medication.category.toLowerCase()).toBe("antibiotiques");
    });
  });

  it("sorts by price ascending", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock?sort=price&order=asc");
    const res = parseResponse(await GET(req));
    const body = res.body as { stocks: Array<{ price: number }> };

    for (let i = 1; i < body.stocks.length; i++) {
      expect(body.stocks[i].price).toBeGreaterThanOrEqual(body.stocks[i - 1].price);
    }
  });

  it("sorts by stock descending", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock?sort=stock&order=desc");
    const res = parseResponse(await GET(req));
    const body = res.body as { stocks: Array<{ stock: number }> };

    for (let i = 1; i < body.stocks.length; i++) {
      expect(body.stocks[i].stock).toBeLessThanOrEqual(body.stocks[i - 1].stock);
    }
  });

  it("enriches items with isLowStock, isExpiringSoon, isExpired flags", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock");
    const res = parseResponse(await GET(req));
    const body = res.body as { stocks: Array<{ isLowStock: boolean; isExpiringSoon: boolean; isExpired: boolean }> };

    body.stocks.forEach((s) => {
      expect(typeof s.isLowStock).toBe("boolean");
      expect(typeof s.isExpiringSoon).toBe("boolean");
      expect(typeof s.isExpired).toBe("boolean");
    });
  });
});

describe("POST /api/pharmacist/stock", () => {
  it("returns 401 when not authenticated", async () => {
    setNoAuth();
    const req = createPostRequest("/api/pharmacist/stock", {});
    const res = parseResponse(await POST(req));
    expect(res.status).toBe(401);
  });

  it("returns 400 with invalid data", async () => {
    setPharmacistAuth();
    const req = createPostRequest("/api/pharmacist/stock", { medicationId: "" });
    const res = parseResponse(await POST(req));
    expect(res.status).toBe(400);
  });

  it("adds a new medication to stock", async () => {
    setPharmacistAuth();
    const req = createPostRequest("/api/pharmacist/stock", {
      medicationId: "med-4",
      price: 2000,
      stock: 30,
      lowStockThreshold: 5,
    });
    const res = parseResponse(await POST(req));
    expect(res.status).toBe(201);

    const body = res.body as { stock: { medicationId: string; price: number; stock: number } };
    expect(body.stock.medicationId).toBe("med-4");
    expect(body.stock.price).toBe(2000);
    expect(body.stock.stock).toBe(30);
  });

  it("returns 409 when medication already in stock", async () => {
    setPharmacistAuth();
    const req = createPostRequest("/api/pharmacist/stock", {
      medicationId: "med-1",
      price: 2500,
      stock: 50,
    });
    const res = parseResponse(await POST(req));
    expect(res.status).toBe(409);
  });
});
