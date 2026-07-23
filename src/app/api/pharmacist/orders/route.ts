import { NextResponse } from "next/server";
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

// GET - Liste des commandes de la pharmacie
export async function GET(req: Request) {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;

  const where: Record<string, unknown> = { pharmacyId: auth.pharmacyId };
  if (status) where.status = status;

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      items: { include: { medication: true } },
    },
  });

  return NextResponse.json({ orders });
}
