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

// GET - Stock history for a medication
export async function GET(req: NextRequest) {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const medicationId = searchParams.get("medicationId") || "";

  if (!medicationId) {
    return NextResponse.json({ error: "medicationId requis" }, { status: 400 });
  }

  const history = await db.stockHistory.findMany({
    where: {
      pharmacyId: auth.pharmacyId,
      medicationId,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ history });
}
