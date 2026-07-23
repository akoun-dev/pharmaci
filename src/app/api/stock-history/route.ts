import { NextRequest, NextResponse } from "next/server";
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

// GET - Historique des mouvements de stock de la pharmacie
export async function GET(req: Request) {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const medicationId = searchParams.get("medicationId") || undefined;
  const changeType = searchParams.get("changeType") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

  const where: Record<string, unknown> = { pharmacyId: auth.pharmacyId };
  if (medicationId) where.medicationId = medicationId;
  if (changeType) where.changeType = changeType;

  const [history, total] = await Promise.all([
    db.stockHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.stockHistory.count({ where }),
  ]);

  const enriched = await Promise.all(
    history.map(async (h) => {
      const medication = await db.medication.findUnique({
        where: { id: h.medicationId },
        select: { id: true, name: true, form: true, dosage: true },
      });
      return { ...h, medication };
    })
  );

  return NextResponse.json({
    history: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
