import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requirePharmacist() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PHARMACIST") return null;
  const pharmacy = await db.pharmacy.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (!pharmacy) return null;
  return { user, pharmacyId: pharmacy.id };
}

const VALID_TARGET_STATUSES = ["CONFIRMED", "READY", "PICKED_UP", "CANCELLED"] as const;

const updateStatusSchema = z.object({
  status: z.enum(VALID_TARGET_STATUSES),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["READY", "CANCELLED"],
  READY: ["PICKED_UP"],
  PICKED_UP: [],
  CANCELLED: [],
};

// GET - Détail d'une commande
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      items: { include: { medication: true } },
      pharmacy: true,
    },
  });

  if (!order || order.pharmacyId !== auth.pharmacyId) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

// PUT - Modifier le statut d'une commande
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order || order.pharmacyId !== auth.pharmacyId) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Statut invalide", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const newStatus = parsed.data.status;
  const allowed = ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Transition non autorisée: ${order.status} → ${newStatus}` },
      { status: 400 }
    );
  }

  if (newStatus === "CANCELLED") {
    const updated = await db.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.pharmacyMedication.update({
          where: {
            pharmacyId_medicationId: {
              pharmacyId: auth.pharmacyId,
              medicationId: item.medicationId,
            },
          },
          data: { stock: { increment: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id },
        data: { status: newStatus },
        include: {
          items: { include: { medication: true } },
          user: { select: { id: true, name: true, phone: true } },
          pharmacy: true,
        },
      });
    });
    return NextResponse.json({ order: updated });
  }

  const updated = await db.order.update({
    where: { id },
    data: { status: newStatus },
    include: {
      items: { include: { medication: true } },
      user: { select: { id: true, name: true, phone: true } },
      pharmacy: true,
    },
  });

  return NextResponse.json({ order: updated });
}
