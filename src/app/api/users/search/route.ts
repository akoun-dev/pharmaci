import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/users/search?q=... — Recherche d'utilisateurs (tout rôle authentifié)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

  if (!q) {
    return NextResponse.json({ users: [] });
  }

  const users = await db.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}
