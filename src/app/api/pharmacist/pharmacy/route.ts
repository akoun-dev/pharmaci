import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePharmacistWithPharmacy } from "@/lib/auth";

const updatePharmacySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  district: z.string().optional().nullable(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  isOpen24h: z.boolean().optional(),
  isOnGuard: z.boolean().optional(),
  imageUrl: z.string().optional().nullable(),
  services: z.string().optional(),
  payments: z.string().optional(),
});

// GET - Détails de la pharmacie du pharmacien
export async function GET() {
  const guard = await requirePharmacistWithPharmacy();
  if (!guard.ok) return guard.error;
  const auth = guard.auth;

  const pharmacy = await db.pharmacy.findUnique({
    where: { id: auth.pharmacyId },
    include: {
      _count: {
        select: {
          medications: true,
          orders: true,
          reviews: true,
        },
      },
    },
  });

  return NextResponse.json({ pharmacy });
}

// PUT - Modifier la pharmacie
export async function PUT(req: NextRequest) {
  const guard = await requirePharmacistWithPharmacy();
  if (!guard.ok) return guard.error;
  const auth = guard.auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = updatePharmacySchema.safeParse(body);
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
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) updateData[key] = val;
  }

  const pharmacy = await db.pharmacy.update({
    where: { id: auth.pharmacyId },
    data: updateData,
  });

  return NextResponse.json({ pharmacy });
}
