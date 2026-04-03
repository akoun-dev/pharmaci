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
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const sort = searchParams.get('sort') || 'name_asc';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: Prisma.PharmacyMedicationWhereInput = { pharmacyId };

    if (q) {
      where.medication = {
        OR: [
          { name: { contains: q } },
          { commercialName: { contains: q } },
        ],
      };
    }

    if (status === 'in_stock') {
      where.inStock = true;
      where.quantity = { gt: 10 };
    } else if (status === 'out_of_stock') {
      where.inStock = false;
    } else if (status === 'low_stock') {
      where.inStock = true;
      where.quantity = { gte: 1, lte: 10 };
    }

    // Build orderBy
    let orderBy: Prisma.PharmacyMedicationOrderByWithRelationInput = {};
    if (sort === 'name_asc') {
      orderBy = { medication: { name: 'asc' } };
    } else if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'quantity_desc') {
      orderBy = { quantity: 'desc' };
    } else if (sort === 'expiration_asc') {
      orderBy = { expirationDate: 'asc' };
    }

    const stocks = await db.pharmacyMedication.findMany({
      where,
      include: {
        medication: true,
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    const total = await db.pharmacyMedication.count({ where });

    return NextResponse.json({ stocks, total, limit, offset });
  } catch (error) {
    console.error('Error fetching pharmacist stocks:', error);
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
    const { medicationId, price, quantity, inStock, needsPrescription, expirationDate } = body;
    const pharmacyId = user.linkedPharmacyId;

    if (!medicationId || price === undefined || quantity === undefined) {
      return NextResponse.json(
        { error: 'medicationId, price et quantity sont requis' },
        { status: 400 }
      );
    }

    // Check if stock already exists
    const existing = await db.pharmacyMedication.findUnique({
      where: {
        pharmacyId_medicationId: { pharmacyId, medicationId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ce médicament existe déjà dans votre stock' },
        { status: 409 }
      );
    }

    const stock = await db.pharmacyMedication.create({
      data: {
        pharmacyId,
        medicationId,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        inStock: inStock !== false,
        needsPrescription: needsPrescription === true,
        ...(expirationDate ? { expirationDate: new Date(expirationDate) } : {}),
      },
      include: {
        medication: true,
      },
    });

    // Create stock history entry
    await db.stockHistory.create({
      data: {
        pharmacyId,
        medicationId,
        type: 'entry',
        quantity: parseInt(quantity, 10),
        note: 'Ajout initial au stock',
      },
    });

    return NextResponse.json(stock, { status: 201 });
  } catch (error) {
    console.error('Error creating pharmacist stock:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
