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

const updateStockSchema = z.object({
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  expiryDate: z.string().optional().nullable(),
});

// PUT - Modifier un stock
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await db.pharmacyMedication.findUnique({
    where: { id },
    select: { pharmacyId: true, stock: true, medicationId: true },
  });

  if (!existing || existing.pharmacyId !== auth.pharmacyId) {
    return NextResponse.json({ error: "Stock introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = updateStockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucune donnée à modifier" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (data.price !== undefined) updateData.price = data.price;
  if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold;
  if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

  if (data.stock !== undefined) {
    const diff = data.stock - existing.stock;
    updateData.stock = data.stock;

    if (diff !== 0) {
      await db.stockHistory.create({
        data: {
          pharmacyId: auth.pharmacyId,
          medicationId: existing.medicationId,
          changeType: diff > 0 ? "ADD" : "REMOVE",
          quantity: Math.abs(diff),
          note: diff > 0 ? `Ajout de ${diff} unités` : `Retrait de ${Math.abs(diff)} unités`,
        },
      });
    }
  }

  const updated = await db.pharmacyMedication.update({
    where: { id },
    data: updateData,
    include: { medication: true },
  });

  return NextResponse.json({ stock: updated });
}

// DELETE - Supprimer un médicament du stock
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await db.pharmacyMedication.findUnique({
    where: { id },
    select: { pharmacyId: true, medicationId: true, stock: true },
  });

  if (!existing || existing.pharmacyId !== auth.pharmacyId) {
    return NextResponse.json({ error: "Stock introuvable" }, { status: 404 });
  }

  await db.stockHistory.create({
    data: {
      pharmacyId: auth.pharmacyId,
      medicationId: existing.medicationId,
      changeType: "REMOVE",
      quantity: existing.stock,
      note: "Suppression du médicament du stock",
    },
  });

  await db.pharmacyMedication.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
