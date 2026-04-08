import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "L'email est requis" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { email: true },
    });

    // For security, always return the same message whether user exists or not
    if (!user) {
      return NextResponse.json({
        message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
      });
    }

    // In production, send a password reset email here.
    // For demo purposes, return the user's email as confirmation.
    return NextResponse.json({
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
      _demoEmail: user.email,
    });
  } catch (error) {
    logger.error('Error in forgot password:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
