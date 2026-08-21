import { describe, it, expect } from "vitest";
import { PUT, DELETE } from "@/app/api/pharmacist/stock/[id]/route";
import { createPutRequest, createDeleteRequest, setPharmacistAuth, setNoAuth, parseResponse, createParams } from "./helpers";

describe("PUT /api/pharmacist/stock/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    setNoAuth();
    const req = createPutRequest("/api/pharmacist/stock/stock-1", { price: 3000 });
    const res = parseResponse(await PUT(req, { params: createParams("stock-1") }));
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent stock", async () => {
    setPharmacistAuth();
    const req = createPutRequest("/api/pharmacist/stock/nonexistent", { price: 3000 });
    const res = parseResponse(await PUT(req, { params: createParams("nonexistent") }));
    expect(res.status).toBe(404);
  });

  it("updates stock price", async () => {
    setPharmacistAuth();
    const req = createPutRequest("/api/pharmacist/stock/stock-1", { price: 3000 });
    const res = parseResponse(await PUT(req, { params: createParams("stock-1") }));
    expect(res.status).toBe(200);

    const body = res.body as { stock: { id: string; price: number } };
    expect(body.stock.id).toBe("stock-1");
    expect(body.stock.price).toBe(3000);
  });

  it("updates stock quantity and creates history entry", async () => {
    setPharmacistAuth();
    const req = createPutRequest("/api/pharmacist/stock/stock-1", { stock: 60 });
    const res = parseResponse(await PUT(req, { params: createParams("stock-1") }));
    expect(res.status).toBe(200);

    const body = res.body as { stock: { stock: number } };
    expect(body.stock.stock).toBe(60);
  });

  it("returns 400 with invalid price", async () => {
    setPharmacistAuth();
    const req = createPutRequest("/api/pharmacist/stock/stock-1", { price: -100 });
    const res = parseResponse(await PUT(req, { params: createParams("stock-1") }));
    expect(res.status).toBe(400);
  });

  it("returns 400 with empty body", async () => {
    setPharmacistAuth();
    const req = createPutRequest("/api/pharmacist/stock/stock-1", {});
    const res = parseResponse(await PUT(req, { params: createParams("stock-1") }));
    expect(res.status).toBe(400);
  });

  it("updates expiry date", async () => {
    setPharmacistAuth();
    const req = createPutRequest("/api/pharmacist/stock/stock-1", {
      expiryDate: "2027-12-31",
    });
    const res = parseResponse(await PUT(req, { params: createParams("stock-1") }));
    expect(res.status).toBe(200);
  });

  it("clears expiry date with null", async () => {
    setPharmacistAuth();
    const req = createPutRequest("/api/pharmacist/stock/stock-3", {
      expiryDate: null,
    });
    const res = parseResponse(await PUT(req, { params: createParams("stock-3") }));
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/pharmacist/stock/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    setNoAuth();
    const req = createDeleteRequest("/api/pharmacist/stock/stock-1");
    const res = parseResponse(await DELETE(req, { params: createParams("stock-1") }));
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent stock", async () => {
    setPharmacistAuth();
    const req = createDeleteRequest("/api/pharmacist/stock/nonexistent");
    const res = parseResponse(await DELETE(req, { params: createParams("nonexistent") }));
    expect(res.status).toBe(404);
  });

  it("deletes a stock item and returns success", async () => {
    setPharmacistAuth();
    const req = createDeleteRequest("/api/pharmacist/stock/stock-1");
    const res = parseResponse(await DELETE(req, { params: createParams("stock-1") }));
    expect(res.status).toBe(200);

    const body = res.body as { success: boolean };
    expect(body.success).toBe(true);
  });
});
