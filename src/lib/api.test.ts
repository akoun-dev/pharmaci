import { describe, it, expect } from "vitest";
import {
  formatFCFA,
  formatRelative,
  haversineDistance,
  formatDistance,
  notificationMessage,
  pharmacistNotificationMessage,
  ORDER_STATUS,
} from "./api";

describe("formatFCFA", () => {
  it("formats zero", () => {
    expect(formatFCFA(0)).toBe("0 CFA");
  });

  it("formats small numbers", () => {
    expect(formatFCFA(100)).toBe("100 CFA");
  });

  it("formats thousands", () => {
    expect(formatFCFA(1500)).toBe("1 500 CFA");
  });

  it("formats millions", () => {
    expect(formatFCFA(1000000)).toBe("1 000 000 CFA");
  });

  it("formats large numbers with spaces", () => {
    expect(formatFCFA(1234567)).toBe("1 234 567 CFA");
  });
});

describe("formatRelative", () => {
  it('returns "À l\'instant" for recent dates', () => {
    const result = formatRelative(new Date().toISOString());
    expect(result).toBe("À l'instant");
  });

  it('returns minutes for dates within the hour', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelative(date)).toBe("Il y a 5 min");
  });

  it("returns hours for dates within the day", () => {
    const date = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(formatRelative(date)).toBe("Il y a 3 h");
  });

  it("returns days for dates within the week", () => {
    const date = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(formatRelative(date)).toBe("Il y a 2 j");
  });
});

describe("haversineDistance", () => {
  it("returns 0 for the same point", () => {
    const d = haversineDistance(5.36, -4.01, 5.36, -4.01);
    expect(d).toBeCloseTo(0, 5);
  });

  it("calculates approximate distance between two points", () => {
    // Abidjan (Cocody) to Abidjan (Plateau) ~ 5-6 km
    const d = haversineDistance(5.3601, -4.0086, 5.3164, -4.0083);
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(10);
  });

  it("is symmetric", () => {
    const d1 = haversineDistance(5.36, -4.01, 5.32, -4.02);
    const d2 = haversineDistance(5.32, -4.02, 5.36, -4.01);
    expect(d1).toBeCloseTo(d2, 5);
  });
});

describe("formatDistance", () => {
  it("formats meters for distances < 1 km", () => {
    expect(formatDistance(0.5)).toBe("500 m");
  });

  it("formats kilometers for distances >= 1 km", () => {
    expect(formatDistance(3.7)).toBe("3.7 km");
  });

  it("rounds to 1 decimal for km", () => {
    expect(formatDistance(1.234)).toBe("1.2 km");
  });
});

describe("ORDER_STATUS", () => {
  it("has all required statuses", () => {
    expect(ORDER_STATUS).toHaveProperty("PENDING");
    expect(ORDER_STATUS).toHaveProperty("CONFIRMED");
    expect(ORDER_STATUS).toHaveProperty("READY");
    expect(ORDER_STATUS).toHaveProperty("PICKED_UP");
    expect(ORDER_STATUS).toHaveProperty("CANCELLED");
  });

  it('has label "En attente" for PENDING', () => {
    expect(ORDER_STATUS.PENDING.label).toBe("En attente");
  });

  it('has label "Annulée" for CANCELLED', () => {
    expect(ORDER_STATUS.CANCELLED.label).toBe("Annulée");
  });

  it("has color classes for each status", () => {
    for (const status of Object.values(ORDER_STATUS)) {
      expect(status.color).toMatch(/^bg-/);
    }
  });
});

describe("notificationMessage (patient)", () => {
  const pharmacy = "Pharmacie Centrale";
  const code = "PHARMACI-ABC123";

  it("generates PENDING message", () => {
    const msg = notificationMessage("PENDING", pharmacy, code);
    expect(msg).toContain(code);
    expect(msg).toContain(pharmacy);
    expect(msg).toContain("en attente");
  });

  it("generates READY message", () => {
    const msg = notificationMessage("READY", pharmacy, code);
    expect(msg).toContain("prête");
    expect(msg).toContain(pharmacy);
  });

  it("generates CANCELLED message", () => {
    const msg = notificationMessage("CANCELLED", pharmacy, code);
    expect(msg).toContain("annulée");
    expect(msg).toContain(code);
  });

  it("handles missing pharmacy name", () => {
    const msg = notificationMessage("PENDING", "", code);
    expect(msg).toContain("la pharmacie");
  });
});

describe("pharmacistNotificationMessage", () => {
  const user = "Jean Dupont";
  const code = "PHARMACI-XYZ789";

  it("generates PENDING message for new orders", () => {
    const msg = pharmacistNotificationMessage("PENDING", user, code, "");
    expect(msg).toContain("Nouvelle commande");
    expect(msg).toContain(code);
    expect(msg).toContain(user);
  });

  it("generates PICKED_UP message", () => {
    const msg = pharmacistNotificationMessage("PICKED_UP", user, code, "");
    expect(msg).toContain("récupéré");
    expect(msg).toContain(user);
  });

  it("generates CANCELLED message", () => {
    const msg = pharmacistNotificationMessage("CANCELLED", user, code, "");
    expect(msg).toContain("annulée");
    expect(msg).toContain(user);
  });

  it("handles missing user name", () => {
    const msg = pharmacistNotificationMessage("PENDING", "", code, "");
    expect(msg).toContain("Un client");
  });
});
