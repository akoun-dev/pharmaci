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

const addStockSchema = z.object({
  medicationId: z.string().min(1),
  price: z.number().int().positive("Le prix doit être positif"),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional().default(10),
  expiryDate: z.string().optional().nullable(),
});

const updateStockSchema = z.object({
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  expiryDate: z.string().optional().nullable(),
});

// GET - Liste des stocks de la pharmacie
export async function GET(req: NextRequest) {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const lowStockOnly = searchParams.get("lowStock") === "true";

  let stocks = await db.pharmacyMedication.findMany({
    where: { pharmacyId: auth.pharmacyId },
    include: { medication: true },
    orderBy: { medication: { name: "asc" } },
  });

  if (search) {
    const lower = search.toLowerCase();
    stocks = stocks.filter(
      (s) =>
        s.medication.name.toLowerCase().includes(lower) ||
        s.medication.activeIngredient.toLowerCase().includes(lower) ||
        s.medication.category.toLowerCase().includes(lower)
    );
  }

  if (lowStockOnly) {
    stocks = stocks.filter((s) => s.stock <= s.lowStockThreshold);
  }

  return NextResponse.json({
    stocks: stocks.map((s) => ({
      id: s.id,
      medicationId: s.medicationId,
      medication: s.medication,
      price: s.price,
      stock: s.stock,
      lowStockThreshold: s.lowStockThreshold,
      expiryDate: s.expiryDate,
      isLowStock: s.stock <= s.lowStockThreshold,
    })),
    total: stocks.length,
  });
}

// POST - Ajouter un médicament en stock
export async function POST(req: NextRequest) {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = addStockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const medication = await db.medication.findUnique({
    where: { id: data.medicationId },
    select: { id: true, name: true },
  });
  if (!medication) {
    return NextResponse.json({ error: "Médicament introuvable" }, { status: 404 });
  }

  const existing = await db.pharmacyMedication.findUnique({
    where: {
      pharmacyId_medicationId: {
        pharmacyId: auth.pharmacyId,
        medicationId: data.medicationId,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: `Le médicament "${medication.name}" est déjà en stock. Utilisez PUT pour modifier.` },
      { status: 409 }
    );
  }

  const stock = await db.pharmacyMedication.create({
    data: {
      pharmacyId: auth.pharmacyId,
      medicationId: data.medicationId,
      price: data.price,
      stock: data.stock,
      lowStockThreshold: data.lowStockThreshold,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    },
    include: { medication: true },
  });

  await db.stockHistory.create({
    data: {
      pharmacyId: auth.pharmacyId,
      medicationId: data.medicationId,
      changeType: "ADD",
      quantity: data.stock,
      note: "Ajout initial en stock",
    },
  });

  return NextResponse.json({ stock }, { status: 201 });
}
