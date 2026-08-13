import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/users/search?q=... — Recherche d'utilisateurs (tout rôle authentifié)
// Sécurité : on exclut les ADMIN et on ne renvoie pas l'email pour limiter
// l'énumération d'adresses (phishing / credential stuffing). L'email n'est
// utile qu'aux pharmaciens (messagerie patient→pharmacien).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Throttle enumeration of users (email/role harvesting).
  const limited = rateLimit(req, { limit: 30, windowMs: 60 * 1000 });
  if (limited) return limited;

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
        // Never expose admin accounts via user search.
        { role: { not: "ADMIN" } },
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
      role: true,
      // Only return email for pharmacists (contact lookup); patients searching
      // get name + role only.
      ...(user.role === "PHARMACIST" ? { email: true } : {}),
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}
