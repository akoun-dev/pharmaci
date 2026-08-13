import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  verifyPassword,
  createToken,
  setAuthCookie,
  type SessionUser,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Rate limit login attempts per IP + email to slow brute-force attacks.
    const limited = rateLimit(request, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
      keyExtra: email.toLowerCase(),
    });
    if (limited) return limited;

    // Find user by email (include password for verification)
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Create session token and set cookie
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "PATIENT" | "PHARMACIST" | "ADMIN",
      phone: user.phone,
    };

    const token = await createToken(sessionUser);
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        district: user.district,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la connexion" },
      { status: 500 }
    );
  }
}
