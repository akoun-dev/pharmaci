import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, createSessionCookie } from '@/lib/auth';

// POST /api/auth/phone/verify — Verify OTP code
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json({ error: "L'identifiant utilisateur et le code sont requis" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Check if OTP exists and is not expired
    if (!user.otpCode) {
      return NextResponse.json({ error: 'Aucun code en attente. Demandez un nouveau code.' }, { status: 400 });
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Code expiré. Demandez un nouveau code.' }, { status: 410 });
    }

    if (user.otpCode !== code) {
      return NextResponse.json({ error: 'Code incorrect' }, { status: 401 });
    }

    // Mark phone as verified, clear OTP
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: new Date(),
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    const token = await signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      provider: updatedUser.authProvider,
    });
    const { sessionCookie, csrfCookie, csrfToken } = createSessionCookie(token, updatedUser.id);

    return NextResponse.json(
      {
        message: 'Numéro vérifié avec succès',
        token,
        csrfToken,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          city: updatedUser.city,
          authProvider: updatedUser.authProvider,
          phoneVerified: !!updatedUser.phoneVerified,
          linkedPharmacyId: updatedUser.linkedPharmacyId,
        },
      },
      { headers: { 'Set-Cookie': [sessionCookie, csrfCookie].filter(Boolean).join(', ') } }
    );
  } catch (error) {
    logger.error('Phone verify error:', error);
    return NextResponse.json({ error: 'Erreur lors de la vérification' }, { status: 500 });
  }
}
