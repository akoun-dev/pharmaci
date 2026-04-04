import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, hashPassword, createSessionCookie } from '@/lib/auth';

// POST /api/auth/register
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, confirmPassword, authProvider, role, pharmacy } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Le nom est requis (2 caractères minimum)' }, { status: 400 });
    }

    // --- Pharmacist registration ---
    if (role === 'pharmacist') {
      if (authProvider !== 'email') {
        return NextResponse.json({ error: "L'inscription pharmacien n'est disponible que par email" }, { status: 400 });
      }
      if (!email || !password) {
        return NextResponse.json({ error: "L'email et le mot de passe sont requis" }, { status: 400 });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
      }
      if (confirmPassword && password !== confirmPassword) {
        return NextResponse.json({ error: 'Les mots de passe ne correspondent pas' }, { status: 400 });
      }

      // Validate pharmacy info
      if (!pharmacy || !pharmacy.name || !pharmacy.address || !pharmacy.city || !pharmacy.phone) {
        return NextResponse.json({ error: 'Les informations de la pharmacie sont requises (nom, adresse, ville, téléphone)' }, { status: 400 });
      }

      // Check for duplicate email
      const existingEmail = await db.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existingEmail) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
      }

      const hashedPassword = await hashPassword(password);

      // Create pharmacy
      const newPharmacy = await db.pharmacy.create({
        data: {
          name: pharmacy.name.trim(),
          address: pharmacy.address.trim(),
          city: pharmacy.city,
          district: pharmacy.district?.trim() || null,
          phone: pharmacy.phone.replace(/[^0-9+]/g, ''),
          email: pharmacy.email?.trim() || email.toLowerCase(),
          latitude: pharmacy.latitude || 5.3600,
          longitude: pharmacy.longitude || -3.9324,
        },
      });

      // Create user linked to pharmacy
      const user = await db.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          authProvider: 'email',
          role: 'pharmacist',
          linkedPharmacyId: newPharmacy.id,
          city: pharmacy.city,
          address: pharmacy.address.trim(),
        },
      });

      const token = await signToken({ userId: user.id, email: user.email, role: user.role, provider: 'email' });
      const cookie = createSessionCookie(token);

      return NextResponse.json(
        {
          message: 'Inscription pharmacien réussie',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            city: user.city,
            authProvider: user.authProvider,
            linkedPharmacyId: user.linkedPharmacyId,
          },
          pharmacy: {
            id: newPharmacy.id,
            name: newPharmacy.name,
          },
          token,
        },
        { headers: { 'Set-Cookie': cookie } }
      );
    }

    // --- Patient registration (email) ---
    if (authProvider === 'email') {
      if (!email || !password) {
        return NextResponse.json({ error: "L'email et le mot de passe sont requis" }, { status: 400 });
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
      }
      if (confirmPassword && password !== confirmPassword) {
        return NextResponse.json({ error: 'Les mots de passe ne correspondent pas' }, { status: 400 });
      }

      const existingEmail = await db.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existingEmail) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
      }

      const hashedPassword = await hashPassword(password);
      const user = await db.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          authProvider: 'email',
          role: 'patient',
        },
      });

      const token = await signToken({ userId: user.id, email: user.email, role: user.role, provider: 'email' });
      const cookie = createSessionCookie(token);

      return NextResponse.json(
        {
          message: 'Inscription réussie',
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar, city: user.city, authProvider: user.authProvider },
          token,
        },
        { headers: { 'Set-Cookie': cookie } }
      );
    }

    // --- Phone registration (patient only) ---
    if (authProvider === 'phone') {
      if (!phone) {
        return NextResponse.json({ error: 'Le numéro de téléphone est requis' }, { status: 400 });
      }

      // Validate CI phone format: +225 or 0[1-9]...
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      const ciPhoneRegex = /^(\+225|0)[1-9]\d{8}$/;
      if (!ciPhoneRegex.test(cleanPhone)) {
        return NextResponse.json({ error: 'Numéro de téléphone invalide (format CI: +225 XX XX XX XX ou 0X XX XX XX XX)' }, { status: 400 });
      }

      // Normalize phone format
      const normalizedPhone = cleanPhone.startsWith('+225') ? cleanPhone : cleanPhone.replace(/^0/, '+225');

      const existingPhone = await db.user.findUnique({ where: { phone: normalizedPhone } });
      if (existingPhone) {
        return NextResponse.json({ error: 'Ce numéro est déjà utilisé' }, { status: 409 });
      }

      // Generate 4-digit OTP
      const otpCode = String(Math.floor(1000 + Math.random() * 9000));
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const user = await db.user.create({
        data: {
          name: name.trim(),
          phone: normalizedPhone,
          email: `phone-${normalizedPhone.replace(/[^0-9]/g, '')}@pharmapp.local`,
          authProvider: 'phone',
          role: 'patient',
          otpCode,
          otpExpiresAt,
        },
      });

      return NextResponse.json({
        message: 'Code de vérification envoyé par SMS',
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role, authProvider: user.authProvider },
      });
    }

    return NextResponse.json({ error: "Méthode d'authentification non supportée" }, { status: 400 });
  } catch (error) {
    logger.error('Register error:', error);
    return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
  }
}
