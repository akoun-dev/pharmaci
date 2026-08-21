import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacistWithPharmacy } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["READY", "CANCELLED"],
  READY: ["PICKED_UP"],
  PICKED_UP: [],
  CANCELLED: [],
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  READY: "Prête",
  PICKED_UP: "Récupérée",
  CANCELLED: "Annulée",
};

// POST - Rechercher une commande par code QR
export async function POST(req: NextRequest) {
  const guard = await requirePharmacistWithPharmacy();
  if (!guard.ok) return guard.error;
  const auth = guard.auth;

  // Order codes are short (6 chars); throttle brute-force attempts per IP.
  const limited = rateLimit(req, { limit: 20, windowMs: 60 * 1000 });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const { code } = (body as { code?: string }) || {};
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code requis" }, { status: 400 });
  }

  const trimmed = code.trim().toUpperCase();

  const order = await db.order.findFirst({
    where: {
      code: trimmed,
      pharmacyId: auth.pharmacyId,
    },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      items: { include: { medication: true } },
      pharmacy: true,
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Commande introuvable pour cette pharmacie" },
      { status: 404 }
    );
  }

  const allowedNext = VALID_TRANSITIONS[order.status] || [];

  return NextResponse.json({
    order: {
      ...order,
      statusLabel: STATUS_LABELS[order.status] || order.status,
      allowedNext,
    },
  });
}
