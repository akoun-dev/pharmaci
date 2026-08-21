import { vi } from "vitest";

/**
 * Lightweight synchronous NextResponse mock for unit tests.
 *
 * `NextResponse.json` returns a plain object `{ body, status, headers }` so
 * tests can assert synchronously via `parseResponse`. This mirrors what the
 * route handlers actually return at runtime (a JSON payload + status).
 */
export interface MockNextResponse {
  body: unknown;
  status: number;
  headers: Record<string, string>;
}

export class NextResponse {
  body: unknown;
  status: number;
  headers: Record<string, string>;

  constructor(body: unknown, init?: ResponseInit) {
    this.body = body;
    this.status = init?.status ?? 200;
    this.headers = (init?.headers as Record<string, string>) ?? {};
  }

  static json(data: unknown, init?: ResponseInit): MockNextResponse {
    return {
      body: data,
      status: init?.status ?? 200,
      headers: (init?.headers as Record<string, string>) ?? { "Content-Type": "application/json" },
    };
  }

  static redirect(url: string, init?: ResponseInit): MockNextResponse {
    return {
      body: null,
      status: init?.status ?? 307,
      headers: { Location: url },
    };
  }
}

// Mock NextRequest
export class NextRequest extends Request {
  public nextUrl: URL;
  public cookies: Map<string, string>;
  private _formDataFn?: () => Promise<FormData>;

  constructor(input: string | URL, init?: RequestInit) {
    // Normalize relative paths to an absolute URL — the native Request requires
    // an absolute URL, but route tests pass paths like "/api/...".
    const absolute = typeof input === "string" && input.startsWith("/")
      ? `http://localhost:3000${input}`
      : input;
    super(absolute as string, init);
    this.nextUrl = new URL(absolute as string);
    this.cookies = new Map();
  }

  /** Test helper to inject a fake FormData provider. */
  setFormData(fn: () => Promise<FormData>) {
    this._formDataFn = fn;
  }

  async formData(): Promise<FormData> {
    if (this._formDataFn) return this._formDataFn();
    return super.formData();
  }
}
