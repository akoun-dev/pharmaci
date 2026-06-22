import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Helper d'authentification
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

// GET /api/orders/code/[code] - Recherche d'une commande par son code
// (Réservé aux pharmaciens et admins pour vérifier/scanner une commande client)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Réservé aux pharmaciens et admins
  if (user.role !== "PHARMACIST" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Réservé aux pharmaciens et administrateurs" },
      { status: 403 }
    );
  }

  const { code } = await params;

  // Le code est sensible à la casse; on accepte aussi en majuscules
  const normalizedCode = code.toUpperCase().trim();

  const order = await db.order.findUnique({
    where: { code: normalizedCode },
    include: {
      items: {
        include: {
          medication: true,
        },
      },
      pharmacy: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: `Aucune commande trouvée avec le code ${normalizedCode}` },
      { status: 404 }
    );
  }

  // Si pharmacien, vérifier qu'il est bien le propriétaire de la pharmacie de la commande
  if (user.role === "PHARMACIST") {
    const pharmacy = await db.pharmacy.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (!pharmacy || pharmacy.id !== order.pharmacyId) {
      return NextResponse.json(
        { error: "Cette commande n'appartient pas à votre pharmacie" },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({ order });
}
