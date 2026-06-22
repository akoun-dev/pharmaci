import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Helper pour vérifier l'authentification
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

// GET /api/favorites - Liste des pharmacies favorites de l'utilisateur connecté
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      include: {
        pharmacy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const pharmacies = favorites.map((fav) => ({
      favoriteId: fav.id,
      favoritedAt: fav.createdAt,
      ...fav.pharmacy,
    }));

    return NextResponse.json({
      pharmacies,
      total: pharmacies.length,
    });
  } catch (error) {
    console.error("[GET /api/favorites] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des favoris" },
      { status: 500 }
    );
  }
}
