import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Helper pour vérifier l'authentification
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

// GET /api/pharmacies/[id]/favorite - Vérifier si la pharmacie est en favori
export async function GET(
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

    const favorite = await db.favorite.findUnique({
      where: {
        userId_pharmacyId: {
          userId: user.id,
          pharmacyId: id,
        },
      },
    });

    return NextResponse.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("[GET /api/pharmacies/[id]/favorite] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du favori" },
      { status: 500 }
    );
  }
}

// POST /api/pharmacies/[id]/favorite - Ajouter aux favoris
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

    try {
      await db.favorite.create({
        data: {
          userId: user.id,
          pharmacyId: id,
        },
      });
    } catch (error) {
      // Si déjà en favori (contrainte unique), on retourne simplement un succès
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json({
          isFavorite: true,
          message: "Pharmacie déjà en favori",
        });
      }
      throw error;
    }

    return NextResponse.json({ isFavorite: true });
  } catch (error) {
    console.error("[POST /api/pharmacies/[id]/favorite] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout aux favoris" },
      { status: 500 }
    );
  }
}

// DELETE /api/pharmacies/[id]/favorite - Retirer des favoris
export async function DELETE(
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

    await db.favorite.deleteMany({
      where: {
        userId: user.id,
        pharmacyId: id,
      },
    });

    return NextResponse.json({ isFavorite: false });
  } catch (error) {
    console.error("[DELETE /api/pharmacies/[id]/favorite] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du favori" },
      { status: 500 }
    );
  }
}
