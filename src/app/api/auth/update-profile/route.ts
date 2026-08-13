import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  // Reject javascript:/data: URLs that could become XSS/redirect vectors.
  avatarUrl: z
    .string()
    .url("URL d'avatar invalide")
    .refine((u) => u.startsWith("http:") || u.startsWith("https:"), {
      message: "L'avatar doit utiliser http(s)",
    })
    .optional()
    .nullable(),
});

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, phone, address, city, district, avatarUrl } = parsed.data;

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        city: true,
        district: true,
        address: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
