import { logger } from '@/lib/logger';
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
    const city = searchParams.get('city');
    const isGuard = searchParams.get('isGuard');
    const q = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Prisma.PharmacyWhereInput = {};

    if (city) {
      where.city = { contains: city };
    }

    if (isGuard === 'true') {
      where.isGuard = true;
    } else if (isGuard === 'false') {
      where.isGuard = false;
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { address: { contains: q } },
        { district: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const [pharmacies, total] = await Promise.all([
      db.pharmacy.findMany({
        where,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          district: true,
          latitude: true,
          longitude: true,
          phone: true,
          email: true,
          isGuard: true,
          isPartner: true,
          openTime: true,
          closeTime: true,
          isOpen24h: true,
          rating: true,
          reviewCount: true,
          imageUrl: true,
          description: true,
          services: true,
          paymentMethods: true,
          parkingInfo: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              stocks: true,
              orders: true,
              reviews: true,
              favorites: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.pharmacy.count({ where }),
    ]);

    // Get stock summary for each pharmacy
    const pharmacyIds = pharmacies.map((p) => p.id);
    const stockSummaries = pharmacyIds.length > 0
      ? await db.pharmacyMedication.groupBy({
          by: ['pharmacyId'],
          where: { pharmacyId: { in: pharmacyIds } },
          _sum: { quantity: true },
          _count: { _all: true },
        })
      : [];

    const stockMap: Record<string, { totalQuantity: number; totalMedications: number }> = {};
    for (const s of stockSummaries) {
      stockMap[s.pharmacyId] = {
        totalQuantity: s._sum.quantity || 0,
        totalMedications: s._count._all,
      };
    }

    // Count in-stock vs out-of-stock for each pharmacy
    const inStockCounts = pharmacyIds.length > 0
      ? await db.pharmacyMedication.groupBy({
          by: ['pharmacyId'],
          where: { pharmacyId: { in: pharmacyIds }, inStock: true },
          _count: { _all: true },
        })
      : [];

    const inStockMap: Record<string, number> = {};
    for (const s of inStockCounts) {
      inStockMap[s.pharmacyId] = s._count._all;
    }

    return NextResponse.json({
      items: pharmacies.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        district: p.district,
        latitude: p.latitude,
        longitude: p.longitude,
        phone: p.phone,
        email: p.email,
        isGuard: p.isGuard,
        isPartner: p.isPartner,
        openTime: p.openTime,
        closeTime: p.closeTime,
        isOpen24h: p.isOpen24h,
        rating: p.rating,
        reviewCount: p.reviewCount,
        imageUrl: p.imageUrl,
        description: p.description,
        services: p.services,
        paymentMethods: p.paymentMethods,
        parkingInfo: p.parkingInfo,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        medicationCount: p._count.stocks,
        orderCount: p._count.orders,
        reviewCountTotal: p._count.reviews,
        favoriteCount: p._count.favorites,
        stockSummary: {
          ...stockMap[p.id],
          inStockCount: inStockMap[p.id] || 0,
        },
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Erreur liste pharmacies admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, address, city, district, phone, email, isGuard, isOpen24h, isPartner, openTime, closeTime, description, latitude, longitude } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Le nom de la pharmacie est requis' }, { status: 400 });
    }
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      return NextResponse.json({ error: 'La ville est requise' }, { status: 400 });
    }

    // Check name uniqueness
    const existing = await db.pharmacy.findFirst({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Une pharmacie avec ce nom existe déjà' }, { status: 400 });
    }

    const pharmacy = await db.pharmacy.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        city: city.trim(),
        district: district?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        isGuard: !!isGuard,
        isOpen24h: !!isOpen24h,
        isPartner: !!isPartner,
        openTime: openTime?.trim() || null,
        closeTime: closeTime?.trim() || null,
        description: description?.trim() || null,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
      },
    });

    return NextResponse.json({
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
      district: pharmacy.district,
      phone: pharmacy.phone,
      email: pharmacy.email,
      isGuard: pharmacy.isGuard,
      isOpen24h: pharmacy.isOpen24h,
      isPartner: pharmacy.isPartner,
      openTime: pharmacy.openTime,
      closeTime: pharmacy.closeTime,
      description: pharmacy.description,
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
      rating: pharmacy.rating,
      reviewCount: pharmacy.reviewCount,
      createdAt: pharmacy.createdAt.toISOString(),
      updatedAt: pharmacy.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    logger.error('Erreur création pharmacie admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
