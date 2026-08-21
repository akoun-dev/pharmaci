import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacistWithPharmacy } from "@/lib/auth";

// GET - Liste des commandes de la pharmacie
export async function GET(req: Request) {
  const guard = await requirePharmacistWithPharmacy();
  if (!guard.ok) return guard.error;
  const auth = guard.auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search")?.trim() || "";

  const where: Record<string, unknown> = { pharmacyId: auth.pharmacyId };
  if (status) where.status = status;
  // Server-side search so we don't have to ship the entire order history to the
  // client just to filter it. Matches code, patient name or phone.
  if (search) {
    const upper = search.toUpperCase();
    where.OR = [
      { code: { contains: upper } },
      { user: { name: { contains: search } } },
      { user: { phone: { contains: search } } },
    ];
  }

  // Bound the result set: order history grows indefinitely, and the screen
  // re-fetches on every keystroke. Cap to the most recent 200 matching orders.
  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      items: { include: { medication: true } },
    },
  });

  return NextResponse.json({ orders });
}
