import { describe, it, expect } from "vitest";
import { generateOrderCode } from "./auth";

describe("generateOrderCode", () => {
  it("starts with PHARMACI-", () => {
    const code = generateOrderCode();
    expect(code).toMatch(/^PHARMACI-/);
  });

  it("has 6 characters after prefix", () => {
    const code = generateOrderCode();
    const suffix = code.replace("PHARMACI-", "");
    expect(suffix).toHaveLength(6);
  });

  it("uses only valid characters", () => {
    const code = generateOrderCode();
    const suffix = code.replace("PHARMACI-", "");
    expect(suffix).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it("generates unique codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateOrderCode());
    }
    expect(codes.size).toBe(100);
  });

  it("does not use confusing characters (0, O, I, 1)", () => {
    const code = generateOrderCode();
    const suffix = code.replace("PHARMACI-", "");
    expect(suffix).not.toMatch(/[0OI1]/);
  });
});
