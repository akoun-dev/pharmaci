import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/medications/[id] - Détails d'un médicament (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const medication = await db.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      return NextResponse.json(
        { error: "Médicament introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(medication);
  } catch (error) {
    console.error("[GET /api/medications/[id]] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du médicament" },
      { status: 500 }
    );
  }
}
