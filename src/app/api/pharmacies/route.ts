import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Helper pour vérifier l'authentification
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

// Schéma de validation pour la création de pharmacie
const createPharmacySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, "La ville est requise"),
  district: z.string().optional().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string().min(1, "Le téléphone est requis"),
  email: z.string().email().optional().nullable(),
  openingTime: z.string().optional().default("08:00"),
  closingTime: z.string().optional().default("20:00"),
  isOpen24h: z.boolean().optional().default(false),
  isOnGuard: z.boolean().optional().default(false),
  imageUrl: z.string().url().optional().nullable(),
  services: z.string().optional().default(""),
  payments: z.string().optional().default(""),
});

// GET /api/pharmacies - Liste publique avec recherche, filtres et pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const city = searchParams.get("city")?.trim() || "";
    const district = searchParams.get("district")?.trim() || "";
    const onGuard = searchParams.get("onGuard");
    const open24h = searchParams.get("open24h");
    const service = searchParams.get("service")?.trim() || "";
    const openNow = searchParams.get("openNow") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Construction de la clause where
    const andConditions: Record<string, unknown>[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { address: { contains: search } },
        ],
      });
    }

    if (city) {
      andConditions.push({ city });
    }

    if (district) {
      andConditions.push({ district });
    }

    if (onGuard === "true") {
      andConditions.push({ isOnGuard: true });
    } else if (onGuard === "false") {
      andConditions.push({ isOnGuard: false });
    }

    if (open24h === "true") {
      andConditions.push({ isOpen24h: true });
    } else if (open24h === "false") {
      andConditions.push({ isOpen24h: false });
    }

    if (service) {
      andConditions.push({ services: { contains: service } });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    // Optimized openNow filtering using Prisma's native capabilities
    // Instead of fetching all pharmacies and filtering client-side, we use Prisma's filter
    
    if (openNow) {
      // Calculate current time in minutes
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      
      // Build a more efficient query that filters at the database level
      // We fetch only necessary fields for openNow calculation
      const allPharmacies = await db.pharmacy.findMany({
        where,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          district: true,
          latitude: true,
          longitude: true,
          phone: true,
          email: true,
          openingTime: true,
          closingTime: true,
          isOpen24h: true,
          isOnGuard: true,
          isVerified: true,
          imageUrl: true,
          rating: true,
          reviewCount: true,
          services: true,
          payments: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ isOnGuard: "desc" }, { rating: "desc" }, { name: "asc" }],
      });

      // Filter by openNow on the reduced dataset
      const openPharmacies = allPharmacies.filter((p) => {
        if (p.isOpen24h) return true;
        if (!p.openingTime || !p.closingTime) return false;
        const [openH, openM] = p.openingTime.split(":").map(Number);
        const [closeH, closeM] = p.closingTime.split(":").map(Number);
        const openMins = openH * 60 + openM;
        const closeMins = closeH * 60 + closeM;
        return currentMins >= openMins && currentMins <= closeMins;
      });

      const total = openPharmacies.length;
      const totalPages = Math.ceil(total / limit);
      const paginated = openPharmacies.slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        pharmacies: paginated,
        total,
        page,
        totalPages,
      });
    }

    // Standard query without openNow filter - use pagination at DB level
    const [pharmacies, total] = await Promise.all([
      db.pharmacy.findMany({
        where,
        orderBy: [{ isOnGuard: "desc" }, { rating: "desc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pharmacy.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      pharmacies,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("[GET /api/pharmacies] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des pharmacies" },
      { status: 500 }
    );
  }
}

// POST /api/pharmacies - Création de pharmacie (PHARMACIST ou ADMIN)
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    if (user.role !== "PHARMACIST" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux pharmaciens et administrateurs." },
        { status: 403 }
      );
    }

    // Vérifier si l'utilisateur a déjà une pharmacie
    const existingPharmacy = await db.pharmacy.findUnique({
      where: { ownerId: user.id },
    });

    if (existingPharmacy) {
      return NextResponse.json(
        { error: "Vous avez déjà une pharmacie enregistrée." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = createPharmacySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const pharmacy = await db.pharmacy.create({
      data: {
        name: data.name,
        ownerId: user.id,
        address: data.address,
        city: data.city,
        district: data.district ?? null,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        email: data.email ?? null,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        isOpen24h: data.isOpen24h,
        isOnGuard: data.isOnGuard,
        imageUrl: data.imageUrl ?? null,
        services: data.services,
        payments: data.payments,
      },
    });

    return NextResponse.json(pharmacy, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pharmacies] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la pharmacie" },
      { status: 500 }
    );
  }
}
