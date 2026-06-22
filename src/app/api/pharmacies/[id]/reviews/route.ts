import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Helper pour vérifier l'authentification
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

// Schéma de validation pour la création d'avis
const createReviewSchema = z.object({
  rating: z
    .number({ message: "La note est requise" })
    .int()
    .min(1, "La note doit être entre 1 et 5")
    .max(5, "La note doit être entre 1 et 5"),
  comment: z.string().optional().default(""),
});

// GET /api/pharmacies/[id]/reviews - Liste des avis d'une pharmacie (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier que la pharmacie existe
    const pharmacy = await db.pharmacy.findUnique({
      where: { id },
      select: { id: true, name: true, rating: true, reviewCount: true },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacie introuvable" },
        { status: 404 }
      );
    }

    const reviews = await db.review.findMany({
      where: { pharmacyId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: {
        id: r.user.id,
        name: r.user.name,
        avatarUrl: r.user.avatarUrl,
      },
    }));

    return NextResponse.json({
      pharmacy,
      reviews: result,
      total: result.length,
    });
  } catch (error) {
    console.error("[GET /api/pharmacies/[id]/reviews] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des avis" },
      { status: 500 }
    );
  }
}

// POST /api/pharmacies/[id]/reviews - Créer un avis (PATIENT uniquement, un avis par utilisateur)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    if (user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "Seuls les patients peuvent laisser un avis." },
        { status: 403 }
      );
    }

    // Vérifier que la pharmacie existe
    const pharmacy = await db.pharmacy.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacie introuvable" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);

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

    // Créer l'avis — la contrainte unique [userId, pharmacyId] empêche les doublons
    let review;
    try {
      review = await db.review.create({
        data: {
          userId: user.id,
          pharmacyId: id,
          rating: data.rating,
          comment: data.comment,
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });
    } catch (error) {
      // Gestion de la contrainte unique : avis déjà existant
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "Vous avez déjà laissé un avis pour cette pharmacie." },
          { status: 409 }
        );
      }
      throw error;
    }

    // Recalculer la note moyenne et le nombre d'avis de la pharmacie
    const agg = await db.review.aggregate({
      where: { pharmacyId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const newRating = agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0;
    const newCount = agg._count.rating || 0;

    await db.pharmacy.update({
      where: { id },
      data: {
        rating: newRating,
        reviewCount: newCount,
      },
    });

    return NextResponse.json(
      {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          name: review.user.name,
          avatarUrl: review.user.avatarUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/pharmacies/[id]/reviews] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'avis" },
      { status: 500 }
    );
  }
}
