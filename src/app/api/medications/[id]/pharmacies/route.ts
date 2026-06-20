import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/medications/[id]/pharmacies
// Retourne toutes les pharmacies qui ont ce médicament en stock,
// avec le prix et le stock, triées par prix croissant par défaut.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const sort = (searchParams.get("sort") || "price").toLowerCase();

    // Vérifier que le médicament existe
    const medication = await db.medication.findUnique({
      where: { id },
      select: { id: true, name: true, activeIngredient: true, form: true, dosage: true },
    });

    if (!medication) {
      return NextResponse.json(
        { error: "Médicament introuvable" },
        { status: 404 }
      );
    }

    // Récupérer les stocks pour ce médicament
    const stocks = await db.pharmacyMedication.findMany({
      where: { medicationId: id },
      include: {
        pharmacy: true,
      },
    });

    // Construire la liste des pharmacies avec infos de stock
    let results = stocks.map((stock) => ({
      pharmacy: stock.pharmacy,
      price: stock.price,
      stock: stock.stock,
      lowStockThreshold: stock.lowStockThreshold,
      expiryDate: stock.expiryDate,
      distance: null as number | null, // Placeholder — calculé côté client si position utilisateur
    }));

    // Tri
    if (sort === "distance") {
      // Distance non calculée côté serveur (placeholder), on garde l'ordre par défaut
      // puis on applique le prix comme tri secondaire pour un résultat déterministe.
      results.sort((a, b) => a.price - b.price);
    } else if (sort === "rating") {
      results.sort((a, b) => b.pharmacy.rating - a.pharmacy.rating);
    } else {
      // Tri par défaut : prix croissant
      results.sort((a, b) => a.price - b.price);
    }

    return NextResponse.json({
      medication,
      pharmacies: results,
      total: results.length,
    });
  } catch (error) {
    console.error("[GET /api/medications/[id]/pharmacies] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des pharmacies" },
      { status: 500 }
    );
  }
}
