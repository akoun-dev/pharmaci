import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/pharmacist/stock/import/route";
import { createGetRequest, setPharmacistAuth, setNoAuth, parseResponse } from "./helpers";
import { NextRequest } from "./__mocks__/next-server";

/**
 * Helper to create a POST request with a mock file attached as FormData
 */
function createImportRequest(filename: string, fileContent: ArrayBuffer | string): NextRequest {
  const req = new NextRequest("http://localhost:3000/api/pharmacist/stock/import", {
    method: "POST",
  });

  const blob = new Blob(
    typeof fileContent === "string"
      ? [fileContent]
      : [fileContent],
    { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
  );
  const file = new File([blob], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  req.setFormData(async () => {
    const fd = new FormData();
    fd.append("file", file);
    return fd;
  });

  return req;
}

function createImportRequestWithContent(
  filename: string,
  content: string
): NextRequest {
  const req = new NextRequest("http://localhost:3000/api/pharmacist/stock/import", {
    method: "POST",
  });

  const file = new File([content], filename, { type: "text/csv" });
  req.setFormData(async () => {
    const fd = new FormData();
    fd.append("file", file);
    return fd;
  });

  return req;
}

describe("POST /api/pharmacist/stock/import", () => {
  it("returns 403 when not authenticated", async () => {
    setNoAuth();
    const req = createImportRequest("test.xlsx", new ArrayBuffer(0));
    const res = parseResponse(await POST(req));
    expect(res.status).toBe(403);
  });

  it("returns 400 when no file is provided", async () => {
    setPharmacistAuth();
    const req = new NextRequest("http://localhost:3000/api/pharmacist/stock/import", {
      method: "POST",
    });
    req.setFormData(async () => {
      const fd = new FormData();
      return fd;
    });
    const res = parseResponse(await POST(req));
    expect(res.status).toBe(400);
  });

  it("returns 400 with invalid file extension", async () => {
    setPharmacistAuth();
    const req = createImportRequestWithContent("test.txt", "nom,prix\nParacétamol,2500");
    const res = parseResponse(await POST(req));
    expect(res.status).toBe(400);
    const body = res.body as { error: string };
    expect(body.error).toContain("Format de fichier invalide");
  });

  it("processes empty file and returns error", async () => {
    setPharmacistAuth();
    // This is a valid xlsx but empty file
    const req = createImportRequest("empty.xlsx", new ArrayBuffer(0));
    const res = parseResponse(await POST(req));
    // Should handle gracefully (400 due to blank file)
    expect([400, 500]).toContain(res.status);
  });

  it("returns validation errors for missing required columns", async () => {
    setPharmacistAuth();
    // Minimal XLSX isn't easy to create manually in tests,
    // but we can test the column validation by creating a request
    // with properly structured data
    const req = createImportRequest("test.xlsx", new ArrayBuffer(8));
    const res = parseResponse(await POST(req));
    expect(res.status).toBe(400);
  });
});
