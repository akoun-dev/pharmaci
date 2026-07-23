import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

const VALID_STATUSES = ["PENDING", "CONFIRMED", "READY", "PICKED_UP", "CANCELLED"] as const;

// GET - Toutes les commandes (admin)
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;

  const where: Record<string, unknown> = {};
  if (status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    where.status = status;
  }

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      pharmacy: { select: { id: true, name: true, city: true } },
      items: { include: { medication: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json({ orders });
}
