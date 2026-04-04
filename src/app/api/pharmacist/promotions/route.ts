import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, linkedPharmacyId: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Accès réservé aux pharmaciens' }, { status: 403 });
    }

    if (!user.linkedPharmacyId) {
      return NextResponse.json({ error: 'Aucune pharmacie liée à votre compte' }, { status: 403 });
    }

    const pharmacyId = user.linkedPharmacyId;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where: Prisma.PromotionWhereInput = { pharmacyId };
    if (activeOnly) {
      where.isActive = true;
    }

    const promotions = await db.promotion.findMany({
      where,
      include: {
        medication: {
          select: {
            id: true,
            name: true,
            commercialName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      promotions.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        discountType: p.discountType,
        discountValue: p.discountValue,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
        medication: p.medication,
        medicationId: p.medicationId,
      }))
    );
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, linkedPharmacyId: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Accès réservé aux pharmaciens' }, { status: 403 });
    }

    if (!user.linkedPharmacyId) {
      return NextResponse.json({ error: 'Aucune pharmacie liée à votre compte' }, { status: 403 });
    }

    const body = await request.json();
    const { medicationId, name, description, discountType, discountValue, startDate, endDate } = body;

    if (!name || !discountValue || !startDate || !endDate) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    if (discountValue < 1 || discountValue > 100) {
      return NextResponse.json({ error: 'La remise doit être entre 1 et 100' }, { status: 400 });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 });
    }

    if (medicationId) {
      const medExists = await db.medication.findUnique({ where: { id: medicationId } });
      if (!medExists) {
        return NextResponse.json({ error: 'Médicament non trouvé' }, { status: 400 });
      }
    }

    const promotion = await db.promotion.create({
      data: {
        pharmacyId: user.linkedPharmacyId,
        medicationId: medicationId || null,
        name,
        description: description || null,
        discountType: discountType || 'percentage',
        discountValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      include: {
        medication: {
          select: { id: true, name: true, commercialName: true },
        },
      },
    });

    return NextResponse.json({
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      startDate: promotion.startDate.toISOString(),
      endDate: promotion.endDate.toISOString(),
      isActive: promotion.isActive,
      createdAt: promotion.createdAt.toISOString(),
      medication: promotion.medication,
      medicationId: promotion.medicationId,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, linkedPharmacyId: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Accès réservé aux pharmaciens' }, { status: 403 });
    }

    if (!user.linkedPharmacyId) {
      return NextResponse.json({ error: 'Aucune pharmacie liée à votre compte' }, { status: 403 });
    }

    const body = await request.json();
    const { id, medicationId, name, description, discountType, discountValue, startDate, endDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de promotion requis' }, { status: 400 });
    }

    // Check that the promotion belongs to this pharmacy
    const existing = await db.promotion.findFirst({
      where: { id, pharmacyId: user.linkedPharmacyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Promotion non trouvée' }, { status: 404 });
    }

    if (discountValue !== undefined && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json({ error: 'La remise doit être entre 1 et 100' }, { status: 400 });
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 });
    }

    const promotion = await db.promotion.update({
      where: { id },
      data: {
        ...(medicationId !== undefined ? { medicationId: medicationId || null } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(discountType !== undefined ? { discountType } : {}),
        ...(discountValue !== undefined ? { discountValue } : {}),
        ...(startDate !== undefined ? { startDate: new Date(startDate) } : {}),
        ...(endDate !== undefined ? { endDate: new Date(endDate) } : {}),
      },
      include: {
        medication: {
          select: { id: true, name: true, commercialName: true },
        },
      },
    });

    return NextResponse.json({
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      startDate: promotion.startDate.toISOString(),
      endDate: promotion.endDate.toISOString(),
      isActive: promotion.isActive,
      createdAt: promotion.createdAt.toISOString(),
      medication: promotion.medication,
      medicationId: promotion.medicationId,
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, linkedPharmacyId: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Accès réservé aux pharmaciens' }, { status: 403 });
    }

    if (!user.linkedPharmacyId) {
      return NextResponse.json({ error: 'Aucune pharmacie liée à votre compte' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de promotion requis' }, { status: 400 });
    }

    // Check that the promotion belongs to this pharmacy
    const existing = await db.promotion.findFirst({
      where: { id, pharmacyId: user.linkedPharmacyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Promotion non trouvée' }, { status: 404 });
    }

    await db.promotion.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
