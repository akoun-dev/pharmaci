import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, verifyPassword, createSessionCookie } from '@/lib/auth';
import { rateLimit, RateLimits } from '@/lib/rate-limit';

// POST /api/auth/login
export async function POST(request: Request) {
  // Apply rate limiting for login attempts
  const rateLimitResult = await rateLimit(RateLimits.auth)(request);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: rateLimitResult.error, code: 'RATE_LIMIT_EXCEEDED' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { email, password, phone, authProvider } = body;

    // --- Email login ---
    if (authProvider === 'email' || (!authProvider && email)) {
      if (!email || !password) {
        return NextResponse.json({ error: "L'email et le mot de passe sont requis" }, { status: 400 });
      }

      const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user) {
        return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
      }

      if (!user.password) {
        return NextResponse.json({ error: 'Ce compte a été créé via téléphone. Connectez-vous par téléphone.' }, { status: 401 });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
      }

      const token = await signToken({ userId: user.id, email: user.email, role: user.role, provider: user.authProvider });
      const { sessionCookie, csrfCookie, csrfToken } = createSessionCookie(token, user.id);

      const response = NextResponse.json(
        {
          message: 'Connexion réussie',
          token,
          csrfToken,
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar, city: user.city, authProvider: user.authProvider, linkedPharmacyId: user.linkedPharmacyId },
        }
      );

      // Set cookies using append to properly set multiple Set-Cookie headers
      response.headers.append('Set-Cookie', sessionCookie);
      if (csrfCookie) {
        response.headers.append('Set-Cookie', csrfCookie);
      }

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toISOString());

      return response;
    }

    // --- Phone login ---
    if (authProvider === 'phone' || (!authProvider && phone)) {
      if (!phone) {
        return NextResponse.json({ error: 'Le numéro de téléphone est requis' }, { status: 400 });
      }

      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      const normalizedPhone = cleanPhone.startsWith('+225') ? cleanPhone : cleanPhone.replace(/^0/, '+225');

      const user = await db.user.findUnique({ where: { phone: normalizedPhone } });
      if (!user) {
        return NextResponse.json({ error: 'Numéro non trouvé. Veuillez vous inscrire.' }, { status: 404 });
      }

      // Generate new OTP for login
      const otpCode = String(Math.floor(1000 + Math.random() * 9000));
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await db.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt },
      });

      return NextResponse.json({
        message: 'OTP envoyé',
        userId: user.id,
      });
    }

    return NextResponse.json({ error: 'Identifiants requis (email ou téléphone)' }, { status: 400 });
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur lors de la connexion' }, { status: 500 });
  }
}
