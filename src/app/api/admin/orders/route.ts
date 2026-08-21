import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "READY", "PICKED_UP", "CANCELLED"] as const;

// GET - Toutes les commandes (admin) avec pagination et recherche
export async function GET(req: Request) {
  try {
    const adminGuard = await requireRole("ADMIN");
    if (!adminGuard.ok) return adminGuard.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const andConditions: Record<string, unknown>[] = [];
    if (status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      andConditions.push({ status });
    }
    if (search) {
      andConditions.push({
        OR: [
          { code: { contains: search.toUpperCase() } },
          { user: { name: { contains: search } } },
          { pharmacy: { name: { contains: search } } },
        ],
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    // Search-only filter (ignores the status tab) for the global status counts
    // so every tab badge is correct, not just the active one.
    const searchWhere = search
      ? {
          OR: [
            { code: { contains: search.toUpperCase() } },
            { user: { name: { contains: search } } },
            { pharmacy: { name: { contains: search } } },
          ],
        }
      : {};

    const [orders, total, statusGroups] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          pharmacy: { select: { id: true, name: true, city: true } },
          items: { include: { medication: { select: { id: true, name: true } } } },
        },
      }),
      db.order.count({ where }),
      db.order.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: searchWhere,
      }),
    ]);

    const statusCounts: Record<string, number> = {
      "": total,
      PENDING: 0,
      CONFIRMED: 0,
      READY: 0,
      PICKED_UP: 0,
      CANCELLED: 0,
    };
    for (const g of statusGroups) {
      if (g.status in statusCounts) statusCounts[g.status] = g._count._all;
    }

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      statusCounts,
    });
  } catch (error) {
    console.error("Admin orders error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des commandes" }, { status: 500 });
  }
}
