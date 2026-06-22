import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Helper d'authentification
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

// Statuts à partir desquels un patient peut annuler
const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];

// POST /api/orders/[id]/cancel - Annulation par le patient propriétaire
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Seuls les patients peuvent utiliser cette route d'annulation
  if (user.role !== "PATIENT") {
    return NextResponse.json(
      { error: "Seuls les patients peuvent annuler leur commande via cette route" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Vérifier que la commande appartient à l'utilisateur
  if (order.userId !== user.id) {
    return NextResponse.json(
      { error: "Vous n'êtes pas autorisé à annuler cette commande" },
      { status: 403 }
    );
  }

  // Vérifier que la commande est encore annulable
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return NextResponse.json(
      {
        error: `Cette commande ne peut plus être annulée (statut actuel: ${order.status})`,
      },
      { status: 400 }
    );
  }

  // Transaction: mettre à jour le statut + restaurer le stock
  try {
    const updatedOrder = await db.$transaction(async (tx) => {
      // Restaurer le stock pour chaque item
      for (const item of order.items) {
        await tx.pharmacyMedication.update({
          where: {
            pharmacyId_medicationId: {
              pharmacyId: order.pharmacyId,
              medicationId: item.medicationId,
            },
          },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }

      return tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
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
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'annulation de la commande";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
