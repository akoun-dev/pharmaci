/**
 * Test helper utilities for API route testing.
 */
import { NextRequest } from "./__mocks__/next-server";
import { mockGetCurrentUser } from "./setup";

/**
 * Helper to create a mock NextRequest for GET requests
 */
export function createGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

/**
 * Helper to create a mock NextRequest for POST requests with JSON body
 */
export function createPostRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Helper to create a mock NextRequest for PUT requests with JSON body
 */
export function createPutRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Helper to create a mock NextRequest for DELETE requests
 */
export function createDeleteRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "DELETE" });
}

/**
 * Set the current user as an authenticated pharmacist
 */
export function setPharmacistAuth() {
  mockGetCurrentUser.mockResolvedValue({
    id: "pharmacist-1",
    email: "pharmacist@test.com",
    name: "Dr. Pharmacien",
    role: "PHARMACIST",
    phone: "0102030405",
    pharmacy: {
      id: "pharmacy-1",
      name: "Pharmacie Centrale",
    },
  });
}

/**
 * Set the current user as unauthenticated
 */
export function setNoAuth() {
  mockGetCurrentUser.mockResolvedValue(null);
}

/**
 * Set the current user as a patient (unauthorized for pharmacist routes)
 */
export function setPatientAuth() {
  mockGetCurrentUser.mockResolvedValue({
    id: "patient-1",
    email: "patient@test.com",
    name: "Patient Test",
    role: "PATIENT",
    phone: null,
    pharmacy: null,
  });
}

/**
 * Parse a NextResponse-like object to get its JSON data
 */
export function parseResponse(response: { body: unknown; status: number; headers: Record<string, string> }) {
  return {
    body: response.body as Record<string, unknown>,
    status: response.status,
    headers: response.headers,
  };
}

/**
 * Helper to create params Promise for routes using `params: Promise<{ id }>`
 */
export function createParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}
