import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getCurrentUser,
  verifyPassword,
  deactivateUser,
  clearAuthCookie,
  PharmacyOwnerDeletionError,
} from "@/lib/auth";

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis"),
});

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Mot de passe requis" },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(parsed.data.password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 400 }
      );
    }

    try {
      await deactivateUser(user.id);
    } catch (error) {
      if (error instanceof PharmacyOwnerDeletionError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      throw error;
    }

    await clearAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression du compte" },
      { status: 500 }
    );
  }
}
