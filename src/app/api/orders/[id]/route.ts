import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Helper d'authentification
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

// Transitions de statut autorisées
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["READY", "CANCELLED"],
  READY: ["PICKED_UP"],
  PICKED_UP: [],
  CANCELLED: [],
};

const TARGET_STATUSES = ["CONFIRMED", "READY", "PICKED_UP", "CANCELLED"] as const;

const updateStatusSchema = z.object({
  status: z.enum(TARGET_STATUSES),
});

// Vérifie si l'utilisateur peut accéder à cette commande (propriétaire, pharmacien de la pharmacie, ou admin)
async function canAccessOrder(
  user: { id: string; role: string },
  order: { userId: string; pharmacyId: string }
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role === "PATIENT") return order.userId === user.id;
  if (user.role === "PHARMACIST") {
    const pharmacy = await db.pharmacy.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });
    return !!pharmacy && pharmacy.id === order.pharmacyId;
  }
  return false;
}

// Vérifie si l'utilisateur peut modifier le statut (pharmacien de la pharmacie ou admin)
async function canManageOrder(
  user: { id: string; role: string },
  order: { pharmacyId: string }
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role === "PHARMACIST") {
    const pharmacy = await db.pharmacy.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });
    return !!pharmacy && pharmacy.id === order.pharmacyId;
  }
  return false;
}

// GET /api/orders/[id] - Détail d'une commande
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
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
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const allowed = await canAccessOrder(user, order);
  if (!allowed) {
    return NextResponse.json({ error: "Accès non autorisé à cette commande" }, { status: 403 });
  }

  return NextResponse.json({ order });
}

// PUT /api/orders/[id] - Mise à jour du statut (PHARMACIEN de la pharmacie ou ADMIN)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      pharmacy: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const canManage = await canManageOrder(user, order);
  if (!canManage) {
    return NextResponse.json(
      { error: "Vous n'êtes pas autorisé à modifier cette commande" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parseResult = updateStatusSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Statut invalide", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const newStatus = parseResult.data.status;
  const currentStatus = order.status;

  // Vérifier la transition autorisée
  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowedTargets.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Transition de statut non autorisée: ${currentStatus} → ${newStatus}`,
        allowedTransitions: allowedTargets,
      },
      { status: 400 }
    );
  }

  // Si annulation, restaurer le stock
  if (newStatus === "CANCELLED") {
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
          data: { status: newStatus },
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

  // Mise à jour simple du statut
  const updatedOrder = await db.order.update({
    where: { id },
    data: { status: newStatus },
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

  return NextResponse.json({ order: updatedOrder });
}
