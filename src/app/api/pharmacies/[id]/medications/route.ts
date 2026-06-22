import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/pharmacies/[id]/medications
// Liste des stocks (PharmacyMedication) d'une pharmacie avec détails du médicament
// Filtres supportés: ?search=...&inStock=true
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const inStock = searchParams.get("inStock");

    // Vérifier que la pharmacie existe
    const pharmacy = await db.pharmacy.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacie introuvable" },
        { status: 404 }
      );
    }

    const andConditions: Record<string, unknown>[] = [{ pharmacyId: id }];

    if (inStock === "true") {
      andConditions.push({ stock: { gt: 0 } });
    } else if (inStock === "false") {
      andConditions.push({ stock: 0 });
    }

    let medications = await db.pharmacyMedication.findMany({
      where: { AND: andConditions },
      include: {
        medication: true,
      },
      orderBy: { medication: { name: "asc" } },
    });

    // Filtre de recherche par nom ou principe actif du médicament
    if (search) {
      const lower = search.toLowerCase();
      medications = medications.filter(
        (m) =>
          m.medication.name.toLowerCase().includes(lower) ||
          m.medication.activeIngredient.toLowerCase().includes(lower)
      );
    }

    const result = medications.map((pm) => ({
      id: pm.id,
      medication: pm.medication,
      price: pm.price,
      stock: pm.stock,
      lowStockThreshold: pm.lowStockThreshold,
      expiryDate: pm.expiryDate,
    }));

    return NextResponse.json({
      pharmacy,
      medications: result,
      total: result.length,
    });
  } catch (error) {
    console.error("[GET /api/pharmacies/[id]/medications] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des stocks" },
      { status: 500 }
    );
  }
}
