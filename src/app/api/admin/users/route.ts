import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, deactivateUser, PharmacyOwnerDeletionError } from "@/lib/auth";

const updateUserSchema = z.object({
  role: z.enum(["PATIENT", "PHARMACIST", "ADMIN"]).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

// GET - Liste des utilisateurs
export async function GET(req: Request) {
  try {
    const adminGuard = await requireRole("ADMIN");
    if (!adminGuard.ok) return adminGuard.error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Search filter (shared by the list query and the global role counts so
    // the tab badges reflect the same dataset the admin is browsing).
    const searchWhere = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    // Deleted/anonymized accounts (isActive: false) never show up in the
    // admin list or role counts — they're kept only for order/review history.
    const andConditions: Record<string, unknown>[] = [{ isActive: true }];
    if (search) andConditions.push(searchWhere);
    if (role) andConditions.push({ role });

    const where = { AND: andConditions };

    const [users, total, roleGroups] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          city: true,
          district: true,
          createdAt: true,
          pharmacy: { select: { id: true, name: true } },
          _count: { select: { orders: true, reviews: true } },
        },
      }),
      db.user.count({ where }),
      // Global role distribution (ignores the role tab filter) so the badges
      // are correct regardless of the page shown — previously they were
      // approximated from the first page only.
      db.user.groupBy({
        by: ["role"],
        _count: { _all: true },
        where: { isActive: true, ...searchWhere },
      }),
    ]);

    const roleCounts: Record<string, number> = {
      PATIENT: 0,
      PHARMACIST: 0,
      ADMIN: 0,
    };
    for (const g of roleGroups) {
      if (g.role in roleCounts) roleCounts[g.role] = g._count._all;
    }

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      roleCounts,
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des utilisateurs" }, { status: 500 });
  }
}

// PUT - Modifier un utilisateur
export async function PUT(req: Request) {
  try {
    const adminGuard = await requireRole("ADMIN");
    if (!adminGuard.ok) return adminGuard.error;
    const admin = adminGuard.user;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    }

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { id: userId } });
    if (!existing || !existing.isActive) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const newRole = parsed.data.role;

    // Guard: an admin must not change its own role (avoid self-lockout).
    if (newRole !== undefined && userId === admin.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      );
    }

    // Guard: never demote the last remaining admin (would lock the system out).
    if (existing.role === "ADMIN" && newRole !== undefined && newRole !== "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN", isActive: true } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Impossible : c'est le dernier compte administrateur" },
          { status: 400 }
        );
      }
    }

    // Guard: don't change the role of a pharmacy owner — doing so would leave a
    // Pharmacy pointing at a non-pharmacist owner (ownerId is unique), creating
    // an inconsistent state. The owner must be reassigned first.
    if (
      existing.role === "PHARMACIST" &&
      newRole !== undefined &&
      newRole !== "PHARMACIST"
    ) {
      const owned = await db.pharmacy.findUnique({
        where: { ownerId: userId },
        select: { id: true },
      });
      if (owned) {
        return NextResponse.json(
          {
            error:
              "Cet utilisateur possède une pharmacie. Réassignez ou supprimez la pharmacie avant de changer son rôle.",
          },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(parsed.data)) {
      if (val !== undefined) updateData[key] = val;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à modifier" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        district: true,
        address: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    // Duplicate email → Prisma P2002.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
//
// Users have order/review/message history that must stay intact (and, before
// this, a hard delete simply failed with a foreign-key error for any user who
// had ever placed an order), so the account is anonymized and locked out
// instead — see deactivateUser().
export async function DELETE(req: Request) {
  try {
    const adminGuard = await requireRole("ADMIN");
    if (!adminGuard.ok) return adminGuard.error;
    const admin = adminGuard.user;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id: userId } });
    if (!existing || !existing.isActive) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    try {
      await deactivateUser(userId);
    } catch (error) {
      if (error instanceof PharmacyOwnerDeletionError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
