import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/medications/categories - Liste des catégories distinctes (public)
export async function GET() {
  try {
    const result = await db.medication.findMany({
      where: { category: { not: "" } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    const categories = result.map((r) => r.category).filter(Boolean);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[GET /api/medications/categories] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des catégories" },
      { status: 500 }
    );
  }
}
