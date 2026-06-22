import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export async function GET() {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Build the base response without password
    const response: {
      id: string;
      name: string;
      email: string;
      role: string;
      phone: string | null;
      city: string | null;
      district: string | null;
      address: string | null;
      avatarUrl: string | null;
      pharmacy?: unknown;
    } = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      city: user.city,
      district: user.district,
      address: user.address,
      avatarUrl: user.avatarUrl,
    };

    // Include pharmacy info if user is a pharmacist
    if (user.role === "PHARMACIST" && user.pharmacy) {
      response.pharmacy = user.pharmacy;
    }

    return NextResponse.json({ user: response });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
