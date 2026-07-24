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

// Schéma de validation pour la création de médicament
const createMedicationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  activeIngredient: z.string().min(1, "Le principe actif est requis"),
  category: z.string().min(1, "La catégorie est requise").default("Autre"),
  dosage: z.string().min(1, "Le dosage est requis"),
  form: z.string().min(1, "La forme est requise").default("Comprimé"),
  description: z.string().optional().default(""),
  prescriptionRequired: z.boolean().default(false),
  imageUrl: z.string().url().optional().nullable(),
  sideEffects: z.string().optional().default(""),
  contraindications: z.string().optional().default(""),
});

// GET /api/medications - Liste publique avec recherche, filtre et pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const sort = searchParams.get("sort")?.trim() || "name";
    const prescriptionOnly = searchParams.get("prescriptionOnly") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Construction de la clause where
    const andConditions: Record<string, unknown>[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { activeIngredient: { contains: search } },
        ],
      });
    }

    if (category) {
      andConditions.push({ category });
    }

    if (prescriptionOnly) {
      andConditions.push({ prescriptionRequired: true });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    let orderBy: Record<string, string>;
    if (sort === "popular") {
      orderBy = { orderItems: { _count: "desc" } };
    } else {
      orderBy = { name: "asc" };
    }

    const medications = await db.medication.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Fetch min price for each medication
    const medIds = medications.map((m) => m.id);
    const priceAggs = await db.pharmacyMedication.groupBy({
      by: ["medicationId"],
      where: { medicationId: { in: medIds }, stock: { gt: 0 } },
      _min: { price: true },
    });
    const priceMap = new Map(priceAggs.map((p) => [p.medicationId, p._min.price]));

    const [total] = await Promise.all([
      db.medication.count({ where }),
    ]);

    return NextResponse.json({
      medications: medications.map((m) => ({
        ...m,
        minPrice: priceMap.get(m.id) ?? null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/medications] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des médicaments" },
      { status: 500 }
    );
  }
}

// POST /api/medications - Création de médicament (ADMIN uniquement)
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createMedicationSchema.safeParse(body);

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
    const medication = await db.medication.create({
      data: {
        name: data.name,
        activeIngredient: data.activeIngredient,
        category: data.category,
        dosage: data.dosage,
        form: data.form,
        description: data.description,
        prescriptionRequired: data.prescriptionRequired,
        imageUrl: data.imageUrl ?? null,
        sideEffects: data.sideEffects,
        contraindications: data.contraindications,
      },
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error("[POST /api/medications] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du médicament" },
      { status: 500 }
    );
  }
}
