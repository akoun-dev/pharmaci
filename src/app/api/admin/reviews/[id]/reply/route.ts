import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const admin = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reply } = body;

    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      return NextResponse.json({ error: 'La réponse ne peut pas être vide' }, { status: 400 });
    }

    const review = await db.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    }

    const updatedReview = await db.review.update({
      where: { id },
      data: {
        reply: reply.trim(),
        replyAt: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedReview.id,
      reply: updatedReview.reply,
      replyAt: updatedReview.replyAt?.toISOString(),
    });
  } catch (error) {
    logger.error('Erreur réponse admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
