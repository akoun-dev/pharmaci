import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, generateOrderCode } from "@/lib/auth";

// Helper d'authentification
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

const VALID_STATUSES = ["PENDING", "CONFIRMED", "READY", "PICKED_UP", "CANCELLED"] as const;

const statusFilterSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
});

// Schéma de création de commande
const createOrderItemSchema = z.object({
  medicationId: z.string().min(1, "L'identifiant du médicament est requis"),
  quantity: z.number().int().positive("La quantité doit être un entier positif"),
});

const createOrderSchema = z.object({
  pharmacyId: z.string().min(1, "L'identifiant de la pharmacie est requis"),
  items: z.array(createOrderItemSchema).min(1, "Au moins un médicament est requis"),
  notes: z.string().max(500).optional(),
});

// GET /api/orders - Liste des commandes selon le rôle
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Récupération du filtre status
  const { searchParams } = new URL(req.url);
  const parseResult = statusFilterSchema.safeParse({
    status: searchParams.get("status") ?? undefined,
  });
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Filtre de statut invalide", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }
  const statusFilter = parseResult.data.status;

  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;

  // Adapter la requête selon le rôle
  if (user.role === "PATIENT") {
    where.userId = user.id;
  } else if (user.role === "PHARMACIST") {
    // Trouver la pharmacie possédée par ce pharmacien
    const pharmacy = await db.pharmacy.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (!pharmacy) {
      return NextResponse.json(
        { error: "Aucune pharmacie associée à ce compte pharmacien" },
        { status: 403 }
      );
    }
    where.pharmacyId = pharmacy.id;
  } else if (user.role === "ADMIN") {
    // Aucun filtre supplémentaire - toutes les commandes
  } else {
    return NextResponse.json({ error: "Rôle non autorisé" }, { status: 403 });
  }

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
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

  return NextResponse.json({ orders });
}

// POST /api/orders - Création d'une commande (PATIENT uniquement)
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (user.role !== "PATIENT") {
    return NextResponse.json(
      { error: "Seuls les patients peuvent créer des commandes" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parseResult = createOrderSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { pharmacyId, items, notes } = parseResult.data;

  // Vérifier que la pharmacie existe
  const pharmacy = await db.pharmacy.findUnique({
    where: { id: pharmacyId },
    select: { id: true, name: true },
  });
  if (!pharmacy) {
    return NextResponse.json({ error: "Pharmacie introuvable" }, { status: 404 });
  }

  // Récupérer les stocks des médicaments pour cette pharmacie
  const medicationIds = items.map((i) => i.medicationId);
  const stocks = await db.pharmacyMedication.findMany({
    where: {
      pharmacyId,
      medicationId: { in: medicationIds },
    },
    include: {
      medication: { select: { id: true, name: true } },
    },
  });

  const stockMap = new Map(stocks.map((s) => [s.medicationId, s]));

  // Valider chaque item
  for (const item of items) {
    const stock = stockMap.get(item.medicationId);
    if (!stock) {
      return NextResponse.json(
        { error: `Le médicament ${item.medicationId} n'est pas disponible dans cette pharmacie` },
        { status: 400 }
      );
    }
    if (stock.stock <= 0) {
      return NextResponse.json(
        { error: `Le médicament "${stock.medication.name}" est en rupture de stock` },
        { status: 400 }
      );
    }
    if (stock.stock < item.quantity) {
      return NextResponse.json(
        {
          error: `Stock insuffisant pour "${stock.medication.name}". Disponible: ${stock.stock}, demandé: ${item.quantity}`,
        },
        { status: 400 }
      );
    }
  }

  // Calculer le montant total et préparer les items
  const orderItemsData = items.map((item) => {
    const stock = stockMap.get(item.medicationId)!;
    const unitPrice = stock.price;
    const totalPrice = unitPrice * item.quantity;
    return {
      medicationId: item.medicationId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    };
  });

  const totalAmount = orderItemsData.reduce((sum, i) => sum + i.totalPrice, 0);

  // Générer un code unique (avec retry en cas de collision)
  let code = generateOrderCode();
  const MAX_CODE_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const existing = await db.order.findUnique({ where: { code }, select: { id: true } });
    if (!existing) break;
    code = generateOrderCode();
  }

  // Transaction: créer la commande + décrémenter les stocks
  try {
    const createdOrder = await db.$transaction(async (tx) => {
      // Vérifier à nouveau le stock dans la transaction pour éviter les race conditions
      const freshStocks = await tx.pharmacyMedication.findMany({
        where: {
          pharmacyId,
          medicationId: { in: medicationIds },
        },
        select: { medicationId: true, stock: true, price: true },
      });
      const freshStockMap = new Map(freshStocks.map((s) => [s.medicationId, s]));

      for (const item of items) {
        const fresh = freshStockMap.get(item.medicationId);
        if (!fresh || fresh.stock < item.quantity) {
          throw new Error(
            `Stock insuffisant pour le médicament ${item.medicationId} lors de la validation`
          );
        }
      }

      // Créer la commande
      const order = await tx.order.create({
        data: {
          code,
          userId: user.id,
          pharmacyId,
          status: "PENDING",
          totalAmount,
          notes: notes ?? null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              medication: true,
            },
          },
          pharmacy: true,
        },
      });

      // Décrémenter le stock pour chaque médicament
      for (const item of items) {
        await tx.pharmacyMedication.update({
          where: {
            pharmacyId_medicationId: {
              pharmacyId,
              medicationId: item.medicationId,
            },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      return order;
    });

    return NextResponse.json({ order: createdOrder }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de la création de la commande";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
