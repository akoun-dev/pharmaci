import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/pharmacies/[id] - Détails d'une pharmacie (public)
// Inclut les avis (avec nom utilisateur) et les médicaments en stock
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pharmacy = await db.pharmacy.findUnique({
      where: { id },
      include: {
        medications: {
          include: {
            medication: true,
          },
          orderBy: { medication: { name: "asc" } },
        },
        reviews: {
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
        },
      },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacie introuvable" },
        { status: 404 }
      );
    }

    // Transformer les avis pour ne pas exposer trop d'infos utilisateur
    const reviews = pharmacy.reviews.map((r) => ({
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

    // Médicaments en stock formatés
    const medications = pharmacy.medications.map((pm) => ({
      id: pm.id,
      medication: pm.medication,
      price: pm.price,
      stock: pm.stock,
      lowStockThreshold: pm.lowStockThreshold,
      expiryDate: pm.expiryDate,
    }));

    // Ne pas exposer l'objet owner complet
    const { medications: _meds, reviews: _revs, ...pharmacyBase } = pharmacy;

    return NextResponse.json({
      ...pharmacyBase,
      medications,
      reviews,
    });
  } catch (error) {
    console.error("[GET /api/pharmacies/[id]] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la pharmacie" },
      { status: 500 }
    );
  }
}
