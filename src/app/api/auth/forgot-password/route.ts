import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const RESET_CODES = new Map<string, { email: string; expiresAt: Date }>();

// Cleanup expired codes every 5 minutes to prevent memory leaks
if (typeof globalThis !== "undefined" && !(globalThis as any).__resetCodeCleanup) {
  (globalThis as any).__resetCodeCleanup = setInterval(() => {
    const now = Date.now();
    let deleted = 0;
    for (const [code, data] of RESET_CODES.entries()) {
      if (now > data.expiresAt.getTime()) {
        RESET_CODES.delete(code);
        deleted++;
      }
    }
    if (deleted > 0) {
      console.debug(`[ForgotPassword] Cleaned up ${deleted} expired codes`);
    }
  }, 5 * 60 * 1000);
  
  // Allow cleanup in tests
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    clearInterval((globalThis as any).__resetCodeCleanup);
    (globalThis as any).__resetCodeCleanup = null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit forgot-password requests per IP+email to prevent abuse
    const body = await request.json();
    const email = body?.email;
    
    const limited = rateLimit(request, {
      limit: 3,
      windowMs: 15 * 60 * 1000, // 15 minutes
      keyExtra: email || "unknown",
    });
    if (limited) return limited;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Adresse e-mail requise" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to not leak email existence
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "Si un compte existe avec cet email, un code de réinitialisation a été envoyé.",
      });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    RESET_CODES.set(code, { email: email.toLowerCase(), expiresAt });

    // In production, send email here - NEVER log reset codes in production
    if (process.env.NODE_ENV === "development") {
      console.log(`[FORGOT PASSWORD] Code for ${email}: ${code}`);
    }

    return NextResponse.json({
      success: true,
      message: "Un code de réinitialisation a été envoyé à votre adresse e-mail.",
      // In dev mode, return the code for testing
      ...(process.env.NODE_ENV === "development" && { devCode: code }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    const stored = RESET_CODES.get(code);
    if (!stored || stored.email !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 400 }
      );
    }

    if (new Date() > stored.expiresAt) {
      RESET_CODES.delete(code);
      return NextResponse.json(
        { error: "Code expiré. Demandez un nouveau code." },
        { status: 400 }
      );
    }

    // Hash and update password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword },
    });

    RESET_CODES.delete(code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
