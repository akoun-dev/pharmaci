import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie, verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const admin = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, password: true },
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Ancien et nouveau mot de passe requis' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
    }

    if (!admin.password) {
      return NextResponse.json({ error: 'Aucun mot de passe défini pour ce compte' }, { status: 400 });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, admin.password);
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Ancien mot de passe incorrect' }, { status: 400 });
    }

    // Update password
    const hashedNew = await hashPassword(newPassword);
    await db.user.update({
      where: { id: session.userId },
      data: { password: hashedNew },
    });

    return NextResponse.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur changement mot de passe admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
