import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePharmacistWithPharmacy } from "@/lib/auth";

const updateStockSchema = z.object({
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  // Atomic stock adjustment (±N). Preferred over `stock` for quick +/- edits:
  // it composes with concurrent order decrements instead of overwriting them.
  stockDelta: z.number().int().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  expiryDate: z.string().optional().nullable(),
});

// PUT - Modifier un stock
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePharmacistWithPharmacy();
  if (!guard.ok) return guard.error;
  const auth = guard.auth;

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

  // Resolve the effective stock change. A `stockDelta` (atomic) is preferred
  // over an absolute `stock` so that concurrent order decrements — applied as
  // atomic increments in their own transaction — are preserved instead of being
  // clobbered by a value computed from a stale snapshot.
  let stockDeltaToApply: number | null = null;
  if (data.stockDelta !== undefined && data.stockDelta !== 0) {
    stockDeltaToApply = data.stockDelta;
  } else if (data.stock !== undefined) {
    const diff = data.stock - existing.stock;
    if (diff !== 0) stockDeltaToApply = diff;
  }

  if (stockDeltaToApply === null && Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Aucune donnée à modifier" }, { status: 400 });
  }

  // Commit the stock change and its history row together so they can't diverge.
  const updated = await db.$transaction(async (tx) => {
    if (stockDeltaToApply !== null) {
      // Read the current value inside the transaction and clamp at 0 so a
      // manual edit can't drive the stock negative.
      const row = await tx.pharmacyMedication.findUnique({
        where: { id },
        select: { stock: true },
      });
      const next = Math.max(0, (row?.stock ?? 0) + stockDeltaToApply);
      updateData.stock = next;

      await tx.stockHistory.create({
        data: {
          pharmacyId: auth.pharmacyId,
          medicationId: existing.medicationId,
          changeType: stockDeltaToApply > 0 ? "ADD" : "REMOVE",
          quantity: Math.abs(stockDeltaToApply),
          note:
            stockDeltaToApply > 0
              ? `Ajout de ${stockDeltaToApply} unités`
              : `Retrait de ${Math.abs(stockDeltaToApply)} unités`,
        },
      });
    }

    return tx.pharmacyMedication.update({
      where: { id },
      data: updateData,
      include: { medication: true },
    });
  });

  return NextResponse.json({ stock: updated });
}

// DELETE - Supprimer un médicament du stock
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePharmacistWithPharmacy();
  if (!guard.ok) return guard.error;
  const auth = guard.auth;

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
