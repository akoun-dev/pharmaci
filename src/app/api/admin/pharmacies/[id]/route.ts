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

    const pharmacy = await db.pharmacy.findUnique({
      where: { id },
      include: {
        stocks: {
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
          orderBy: { updatedAt: 'desc' },
        },
        reviews: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            orders: true,
            favorites: true,
            promotions: true,
          },
        },
      },
    });

    if (!pharmacy) {
      return NextResponse.json({ error: 'Pharmacie introuvable' }, { status: 404 });
    }

    // Order stats
    const orderStats = await db.order.groupBy({
      by: ['status'],
      where: { pharmacyId: id },
      _count: true,
      _sum: { totalPrice: true },
    });

    const orderStatsMap: Record<string, { count: number; total: number }> = {};
    let totalRevenue = 0;
    for (const o of orderStats) {
      orderStatsMap[o.status] = {
        count: o._count,
        total: o._sum.totalPrice || 0,
      };
      if (o.status !== 'cancelled') {
        totalRevenue += o._sum.totalPrice || 0;
      }
    }

    // Monthly revenue (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = await db.order.aggregate({
      where: {
        pharmacyId: id,
        status: { in: ['confirmed', 'ready', 'picked_up'] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalPrice: true },
    });

    // Linked pharmacist
    const pharmacist = await db.user.findFirst({
      where: { linkedPharmacyId: id, role: 'pharmacist' },
      select: { id: true, name: true, email: true, phone: true },
    });

    // Recent orders
    const recentOrders = await db.order.findMany({
      where: { pharmacyId: id },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: {
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
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Review summary
    const avgRating = await db.review.aggregate({
      where: { pharmacyId: id },
      _avg: { rating: true },
    });

    // Low stock count
    const lowStockCount = await db.pharmacyMedication.count({
      where: {
        pharmacyId: id,
        quantity: { lt: 10 },
        inStock: true,
      },
    });

    return NextResponse.json({
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
      district: pharmacy.district,
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
      phone: pharmacy.phone,
      email: pharmacy.email,
      isGuard: pharmacy.isGuard,
      isPartner: pharmacy.isPartner,
      openTime: pharmacy.openTime,
      closeTime: pharmacy.closeTime,
      isOpen24h: pharmacy.isOpen24h,
      rating: pharmacy.rating,
      imageUrl: pharmacy.imageUrl,
      description: pharmacy.description,
      services: pharmacy.services,
      paymentMethods: pharmacy.paymentMethods,
      parkingInfo: pharmacy.parkingInfo,
      createdAt: pharmacy.createdAt.toISOString(),
      updatedAt: pharmacy.updatedAt.toISOString(),
      pharmacist,
      stats: {
        totalMedications: pharmacy.stocks.length,
        lowStockCount,
        totalOrders: pharmacy._count.orders,
        totalFavorites: pharmacy._count.favorites,
        totalPromotions: pharmacy._count.promotions,
        totalRevenue,
        monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
        averageRating: avgRating._avg.rating || 0,
        orderStats: orderStatsMap,
      },
      stocks: pharmacy.stocks.map((s) => ({
        id: s.id,
        price: s.price,
        quantity: s.quantity,
        inStock: s.inStock,
        needsPrescription: s.needsPrescription,
        expirationDate: s.expirationDate?.toISOString() || null,
        updatedAt: s.updatedAt.toISOString(),
        medication: s.medication,
      })),
      reviews: pharmacy.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reply: r.reply,
        replyAt: r.replyAt?.toISOString() || null,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        quantity: o.totalQuantity,
        totalQuantity: o.totalQuantity,
        totalPrice: o.totalPrice,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        user: o.user,
        medication: o.items[0]?.medication || null,
        items: o.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          medication: item.medication,
        })),
      })),
    });
  } catch (error) {
    logger.error('Erreur détail pharmacie admin:', error);
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

    const existing = await db.pharmacy.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Pharmacie introuvable' }, { status: 404 });
    }

    const allowedFields = [
      'name', 'address', 'city', 'district', 'latitude', 'longitude',
      'phone', 'email', 'isGuard', 'isPartner', 'openTime', 'closeTime',
      'isOpen24h', 'description', 'services', 'paymentMethods', 'parkingInfo',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Recalculate rating if needed
    if (updateData.rating !== undefined) {
      // Admin can manually set rating if needed, but we typically recalculate
    }

    const updated = await db.pharmacy.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      address: updated.address,
      city: updated.city,
      district: updated.district,
      latitude: updated.latitude,
      longitude: updated.longitude,
      phone: updated.phone,
      email: updated.email,
      isGuard: updated.isGuard,
      isPartner: updated.isPartner,
      openTime: updated.openTime,
      closeTime: updated.closeTime,
      isOpen24h: updated.isOpen24h,
      rating: updated.rating,
      reviewCount: updated.reviewCount,
      imageUrl: updated.imageUrl,
      description: updated.description,
      services: updated.services,
      paymentMethods: updated.paymentMethods,
      parkingInfo: updated.parkingInfo,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('Erreur mise à jour pharmacie admin:', error);
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

    const pharmacy = await db.pharmacy.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            orders: true,
            stocks: true,
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    if (!pharmacy) {
      return NextResponse.json({ error: 'Pharmacie introuvable' }, { status: 404 });
    }

    // Check for active orders
    const activeOrders = await db.order.count({
      where: {
        pharmacyId: id,
        status: { in: ['pending', 'confirmed', 'ready'] },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cette pharmacie : ${activeOrders} commande(s) active(s). Veuillez les annuler ou terminer d'abord.`,
        },
        { status: 400 }
      );
    }

    // Unlink any pharmacist
    await db.user.updateMany({
      where: { linkedPharmacyId: id },
      data: { linkedPharmacyId: null },
    });

    // Delete pharmacy (cascade will handle stocks, reviews, favorites, stockHistory, promotions)
    await db.pharmacy.delete({ where: { id } });

    return NextResponse.json({
      message: 'Pharmacie supprimée avec succès',
      deletedId: id,
    });
  } catch (error) {
    logger.error('Erreur suppression pharmacie admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
