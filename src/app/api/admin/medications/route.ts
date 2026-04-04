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
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const needsPrescription = searchParams.get('needsPrescription');
    const q = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Prisma.MedicationWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (needsPrescription === 'true') {
      where.needsPrescription = true;
    } else if (needsPrescription === 'false') {
      where.needsPrescription = false;
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { commercialName: { contains: q } },
        { activePrinciple: { contains: q } },
        { pathology: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const [medications, total, categoryRows] = await Promise.all([
      db.medication.findMany({
        where,
        select: {
          id: true,
          name: true,
          commercialName: true,
          activePrinciple: true,
          pathology: true,
          category: true,
          description: true,
          dosage: true,
          sideEffects: true,
          needsPrescription: true,
          imageUrl: true,
          form: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              stocks: true,
              orders: true,
              alternatives: true,
              genericOf: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      db.medication.count({ where }),
      db.medication.findMany({
        distinct: ['category'],
        select: { category: true },
        where: { category: { not: null } },
      }),
    ]);

    const categories = categoryRows.map((r) => r.category).filter(Boolean);

    return NextResponse.json({
      items: medications.map((m) => ({
        id: m.id,
        name: m.name,
        commercialName: m.commercialName,
        activePrinciple: m.activePrinciple,
        pathology: m.pathology,
        category: m.category,
        description: m.description,
        dosage: m.dosage,
        sideEffects: m.sideEffects,
        needsPrescription: m.needsPrescription,
        imageUrl: m.imageUrl,
        form: m.form,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        pharmacyCount: m._count.stocks,
        orderCount: m._count.orders,
        alternativeCount: m._count.alternatives,
        genericCount: m._count.genericOf,
      })),
      total,
      limit,
      offset,
      categories,
    });
  } catch (error) {
    console.error('Erreur liste médicaments admin:', error);
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
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      commercialName,
      activePrinciple,
      pathology,
      category,
      description,
      dosage,
      sideEffects,
      needsPrescription,
      imageUrl,
      form,
    } = body;

    if (!name || !commercialName) {
      return NextResponse.json(
        { error: 'Le nom et le nom commercial sont obligatoires' },
        { status: 400 }
      );
    }

    const medication = await db.medication.create({
      data: {
        name,
        commercialName,
        activePrinciple: activePrinciple || null,
        pathology: pathology || null,
        category: category || null,
        description: description || null,
        dosage: dosage || null,
        sideEffects: sideEffects || null,
        needsPrescription: needsPrescription === true,
        imageUrl: imageUrl || null,
        form: form || null,
      },
    });

    return NextResponse.json({
      id: medication.id,
      name: medication.name,
      commercialName: medication.commercialName,
      activePrinciple: medication.activePrinciple,
      pathology: medication.pathology,
      category: medication.category,
      description: medication.description,
      dosage: medication.dosage,
      sideEffects: medication.sideEffects,
      needsPrescription: medication.needsPrescription,
      imageUrl: medication.imageUrl,
      form: medication.form,
      createdAt: medication.createdAt.toISOString(),
      updatedAt: medication.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur création médicament admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
