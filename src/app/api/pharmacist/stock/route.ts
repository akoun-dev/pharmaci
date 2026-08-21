import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePharmacistWithPharmacy } from "@/lib/auth";

const addStockSchema = z.object({
  medicationId: z.string().min(1),
  price: z.number().int().positive("Le prix doit être positif"),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional().default(10),
  expiryDate: z.string().optional().nullable(),
});

// GET - Liste des stocks de la pharmacie
export async function GET(req: NextRequest) {
  const guard = await requirePharmacistWithPharmacy();
  if (!guard.ok) return guard.error;
  const auth = guard.auth;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const lowStockOnly = searchParams.get("lowStock") === "true";
  const expiryFilter = searchParams.get("expiry") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "name";
  const order = searchParams.get("order") || "asc";

  let stocks = await db.pharmacyMedication.findMany({
    where: { pharmacyId: auth.pharmacyId },
    include: { medication: true },
  });

  // Search filter
  if (search) {
    const lower = search.toLowerCase();
    stocks = stocks.filter(
      (s) =>
        s.medication.name.toLowerCase().includes(lower) ||
        s.medication.activeIngredient.toLowerCase().includes(lower) ||
        s.medication.category.toLowerCase().includes(lower)
    );
  }

  // Low stock filter
  if (lowStockOnly) {
    stocks = stocks.filter((s) => s.stock <= s.lowStockThreshold);
  }

  // Category filter
  if (category) {
    stocks = stocks.filter(
      (s) => s.medication.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Expiry filter
  const now = new Date();
  if (expiryFilter === "expiring") {
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    stocks = stocks.filter(
      (s) =>
        s.expiryDate &&
        new Date(s.expiryDate) >= now &&
        new Date(s.expiryDate) <= in30Days
    );
  } else if (expiryFilter === "expired") {
    stocks = stocks.filter(
      (s) => s.expiryDate && new Date(s.expiryDate) < now
    );
  }

  // Sort
  const multiplier = order === "desc" ? -1 : 1;
  stocks.sort((a, b) => {
    switch (sort) {
      case "stock":
        return multiplier * (a.stock - b.stock);
      case "price":
        return multiplier * (a.price - b.price);
      case "expiry":
        const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
        const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
        return multiplier * (dateA - dateB);
      case "name":
      default:
        return multiplier * a.medication.name.localeCompare(b.medication.name);
    }
  });

  // Enrich with computed fields
  const enriched = stocks.map((s) => ({
    id: s.id,
    medicationId: s.medicationId,
    medication: s.medication,
    price: s.price,
    stock: s.stock,
    lowStockThreshold: s.lowStockThreshold,
    expiryDate: s.expiryDate,
    isLowStock: s.stock <= s.lowStockThreshold,
    isExpiringSoon:
      s.expiryDate
        ? (new Date(s.expiryDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24) <=
            30 &&
          new Date(s.expiryDate) >= now
        : false,
    isExpired: s.expiryDate ? new Date(s.expiryDate) < now : false,
  }));

  return NextResponse.json({
    stocks: enriched,
    total: enriched.length,
  });
}

// POST - Ajouter un médicament en stock
export async function POST(req: NextRequest) {
  const guard = await requirePharmacistWithPharmacy();
  if (!guard.ok) return guard.error;
  const auth = guard.auth;

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
