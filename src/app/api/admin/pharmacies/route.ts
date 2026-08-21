import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const updatePharmacySchema = z.object({
  isVerified: z.boolean(),
});

// GET - Liste des pharmacies avec infos détaillées (avec pagination)
export async function GET(req: Request) {
  try {
    const adminGuard = await requireRole("ADMIN");
    if (!adminGuard.ok) return adminGuard.error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const verified = searchParams.get("verified");
    const city = searchParams.get("city")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const andConditions: Record<string, unknown>[] = [];
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { address: { contains: search } },
        ],
      });
    }
    if (verified === "true") andConditions.push({ isVerified: true });
    else if (verified === "false") andConditions.push({ isVerified: false });
    if (city) andConditions.push({ city });

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    // Search-only filter (ignores the verified tab) for the global verified
    // counts so every tab badge reflects the full matching dataset.
    const searchWhere = search
      ? {
          OR: [
            { name: { contains: search } },
            { address: { contains: search } },
          ],
        }
      : {};

    const [pharmacies, total, verifiedTotal, unverifiedTotal] = await Promise.all([
      db.pharmacy.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              medications: true,
              orders: true,
              reviews: true,
            },
          },
        },
      }),
      db.pharmacy.count({ where }),
      db.pharmacy.count({ where: { ...searchWhere, isVerified: true } }),
      db.pharmacy.count({ where: { ...searchWhere, isVerified: false } }),
    ]);

    return NextResponse.json({
      pharmacies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      verifiedCounts: {
        all: verifiedTotal + unverifiedTotal,
        verified: verifiedTotal,
        unverified: unverifiedTotal,
      },
    });
  } catch (error) {
    console.error("Admin pharmacies error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des pharmacies" }, { status: 500 });
  }
}

// PUT - Modifier le statut de vérification d'une pharmacie
export async function PUT(req: Request) {
  try {
    const adminGuard = await requireRole("ADMIN");
    if (!adminGuard.ok) return adminGuard.error;

    const { searchParams } = new URL(req.url);
    const pharmacyId = searchParams.get("id");
    if (!pharmacyId) {
      return NextResponse.json({ error: "ID pharmacie requis" }, { status: 400 });
    }

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

    const pharmacy = await db.pharmacy.update({
      where: { id: pharmacyId },
      data: { isVerified: parsed.data.isVerified },
    });

    return NextResponse.json({ pharmacy });
  } catch (error) {
    console.error("Admin pharmacy update error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
