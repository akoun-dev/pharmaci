import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(
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

    const medication = await db.medication.findUnique({
      where: { id },
      include: {
        alternatives: {
          include: {
            alternative: {
              select: {
                id: true,
                name: true,
                commercialName: true,
                form: true,
                category: true,
              },
            },
          },
        },
        genericOf: {
          include: {
            medication: {
              select: {
                id: true,
                name: true,
                commercialName: true,
                form: true,
                category: true,
              },
            },
          },
        },
        stocks: {
          include: {
            pharmacy: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                phone: true,
                isGuard: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!medication) {
      return NextResponse.json({ error: 'Médicament introuvable' }, { status: 404 });
    }

    // Order stats for this medication
    const orderStats = await db.order.groupBy({
      by: ['status'],
      where: { medicationId: id },
      _count: true,
      _sum: { totalPrice: true, quantity: true },
    });

    const orderStatsMap: Record<string, { count: number; total: number; quantity: number }> = {};
    let totalOrders = 0;
    let totalRevenue = 0;
    for (const o of orderStats) {
      orderStatsMap[o.status] = {
        count: o._count,
        total: o._sum.totalPrice || 0,
        quantity: o._sum.quantity || 0,
      };
      totalOrders += o._count;
      totalRevenue += o._sum.totalPrice || 0;
    }

    // Stock summary across pharmacies
    const totalStock = medication.stocks.reduce((sum, s) => sum + s.quantity, 0);
    const inStockPharmacies = medication.stocks.filter((s) => s.inStock).length;
    const avgPrice = medication.stocks.length > 0
      ? medication.stocks.reduce((sum, s) => sum + s.price, 0) / medication.stocks.length
      : 0;

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
      stats: {
        totalOrders,
        totalRevenue,
        pharmacyCount: medication.stocks.length,
        inStockPharmacies,
        totalStock,
        avgPrice,
        orderStats: orderStatsMap,
      },
      alternatives: medication.alternatives.map((a) => ({
        id: a.id,
        medication: a.alternative,
      })),
      genericOf: medication.genericOf.map((g) => ({
        id: g.id,
        medication: g.medication,
      })),
      stockInfo: medication.stocks.map((s) => ({
        id: s.id,
        price: s.price,
        quantity: s.quantity,
        inStock: s.inStock,
        needsPrescription: s.needsPrescription,
        expirationDate: s.expirationDate?.toISOString() || null,
        updatedAt: s.updatedAt.toISOString(),
        pharmacy: s.pharmacy,
      })),
    });
  } catch (error) {
    logger.error('Erreur détail médicament admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
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

    const existing = await db.medication.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Médicament introuvable' }, { status: 404 });
    }

    const allowedFields = [
      'name', 'commercialName', 'activePrinciple', 'pathology', 'category',
      'description', 'dosage', 'sideEffects', 'needsPrescription', 'imageUrl', 'form',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await db.medication.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      commercialName: updated.commercialName,
      activePrinciple: updated.activePrinciple,
      pathology: updated.pathology,
      category: updated.category,
      description: updated.description,
      dosage: updated.dosage,
      sideEffects: updated.sideEffects,
      needsPrescription: updated.needsPrescription,
      imageUrl: updated.imageUrl,
      form: updated.form,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('Erreur mise à jour médicament admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
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

    const medication = await db.medication.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            stocks: true,
            orders: true,
            alternatives: true,
            genericOf: true,
          },
        },
      },
    });

    if (!medication) {
      return NextResponse.json({ error: 'Médicament introuvable' }, { status: 404 });
    }

    // Check for active orders referencing this medication
    const activeOrders = await db.order.count({
      where: {
        medicationId: id,
        status: { in: ['pending', 'confirmed', 'ready'] },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer ce médicament : ${activeOrders} commande(s) active(s). Veuillez les annuler ou terminer d'abord.`,
        },
        { status: 400 }
      );
    }

    // Delete medication (cascade will handle stocks, alternatives, stockHistory)
    await db.medication.delete({ where: { id } });

    return NextResponse.json({
      message: 'Médicament supprimé avec succès',
      deletedId: id,
    });
  } catch (error) {
    logger.error('Erreur suppression médicament admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
