import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// GET - Liste des pharmacies avec infos détaillées (avec pagination)
export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

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

    const [pharmacies, total] = await Promise.all([
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
    ]);

    return NextResponse.json({
      pharmacies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin pharmacies error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des pharmacies" }, { status: 500 });
  }
}

// PUT - Modifier le statut de vérification d'une pharmacie
export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

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

    const { isVerified } = body as { isVerified?: boolean };
    if (isVerified === undefined) {
      return NextResponse.json({ error: "isVerified requis" }, { status: 400 });
    }

    const pharmacy = await db.pharmacy.update({
      where: { id: pharmacyId },
      data: { isVerified },
    });

    return NextResponse.json({ pharmacy });
  } catch (error) {
    console.error("Admin pharmacy update error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
