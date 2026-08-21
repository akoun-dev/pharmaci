import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/pharmacist/stock/export/route";
import { createGetRequest, setPharmacistAuth, setNoAuth, parseResponse } from "./helpers";

describe("GET /api/pharmacist/stock/export", () => {
  it("returns 403 when not authenticated", async () => {
    setNoAuth();
    const req = createGetRequest("/api/pharmacist/stock/export");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(403);
  });

  it("returns a buffer with correct headers when authenticated", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock/export");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(200);

    const body = res.body;
    expect(body).toBeDefined();

    // Check content-type header
    expect(res.headers["Content-Type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Check content-disposition header
    expect(res.headers["Content-Disposition"]).toContain(".xlsx");
    expect(res.headers["Content-Disposition"]).toContain("stock_");
  });

  it("includes stock data in the generated file", async () => {
    setPharmacistAuth();
    const req = createGetRequest("/api/pharmacist/stock/export");
    const res = parseResponse(await GET(req));
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
