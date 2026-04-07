import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

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

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        address: true,
        city: true,
        linkedPharmacyId: true,
        authProvider: true,
        phoneVerified: true,
        emailVerified: true,
        notificationPreferences: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            favorites: true,
            sentMessages: true,
            receivedMessages: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Get linked pharmacy info
    let linkedPharmacy = null;
    if (user.linkedPharmacyId) {
      linkedPharmacy = await db.pharmacy.findUnique({
        where: { id: user.linkedPharmacyId },
        select: { id: true, name: true, city: true, address: true },
      });
    }

    // Get order stats
    const orderStats = await db.order.groupBy({
      by: ['status'],
      where: { userId: id },
      _count: true,
      _sum: { totalPrice: true },
    });

    const orderStatsMap: Record<string, { count: number; total: number }> = {};
    let totalSpent = 0;
    for (const o of orderStats) {
      orderStatsMap[o.status] = {
        count: o._count,
        total: o._sum.totalPrice || 0,
      };
      if (o.status !== 'cancelled') {
        totalSpent += o._sum.totalPrice || 0;
      }
    }

    // Get recent orders
    const recentOrders = await db.order.findMany({
      where: { userId: id },
      include: {
        pharmacy: { select: { id: true, name: true, city: true } },
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
      take: 5,
    });

    // Get recent reviews
    const recentReviews = await db.review.findMany({
      where: { userId: id },
      include: {
        pharmacy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      ...user,
      phoneVerified: user.phoneVerified?.toISOString() || null,
      emailVerified: user.emailVerified?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      linkedPharmacy,
      orderStats: orderStatsMap,
      totalSpent,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        quantity: o.totalQuantity,
        totalQuantity: o.totalQuantity,
        totalPrice: o.totalPrice,
        createdAt: o.createdAt.toISOString(),
        pharmacy: o.pharmacy,
        medication: o.items[0]?.medication || null,
        items: o.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          medication: item.medication,
        })),
      })),
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reply: r.reply,
        createdAt: r.createdAt.toISOString(),
        pharmacy: r.pharmacy,
      })),
    });
  } catch (error) {
    logger.error('Erreur détail utilisateur admin:', error);
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
    const { role, name, email, phone, linkedPharmacyId, city, password } = body;

    // Check user exists
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Check email uniqueness if changing
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findUnique({ where: { email } });
      if (emailExists) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
      }
    }

    // Check phone uniqueness if changing
    if (phone && phone !== existingUser.phone) {
      const phoneExists = await db.user.findFirst({ where: { phone } });
      if (phoneExists) {
        return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 400 });
      }
    }

    // Check linkedPharmacyId exists if provided
    if (linkedPharmacyId) {
      const pharmacy = await db.pharmacy.findUnique({ where: { id: linkedPharmacyId } });
      if (!pharmacy) {
        return NextResponse.json({ error: 'Pharmacie introuvable' }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined && ['patient', 'pharmacist', 'admin'].includes(role)) {
      updateData.role = role;
    }
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (linkedPharmacyId !== undefined) updateData.linkedPharmacyId = linkedPharmacyId;
    if (city !== undefined) updateData.city = city;
    if (password !== undefined && password.length >= 6) {
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        city: true,
        linkedPharmacyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ...updatedUser,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('Erreur mise à jour utilisateur admin:', error);
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

    // Prevent self-deletion
    if (id === session.userId) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            favorites: true,
            sentMessages: true,
            receivedMessages: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Check for active orders that can't be cascade-deleted cleanly
    const activeOrders = await db.order.count({
      where: {
        userId: id,
        status: { in: ['pending', 'confirmed', 'ready'] },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cet utilisateur : ${activeOrders} commande(s) active(s). Veuillez les annuler ou terminer d'abord.`,
        },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle related records)
    await db.user.delete({ where: { id } });

    return NextResponse.json({
      message: 'Utilisateur supprimé avec succès',
      deletedId: id,
    });
  } catch (error) {
    logger.error('Erreur suppression utilisateur admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
