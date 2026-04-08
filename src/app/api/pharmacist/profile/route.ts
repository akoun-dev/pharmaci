import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

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

    const pharmacy = await db.pharmacy.findUnique({
      where: { id: user.linkedPharmacyId },
    });

    if (!pharmacy) {
      return NextResponse.json({ error: 'Pharmacie introuvable' }, { status: 404 });
    }

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
      reviewCount: pharmacy.reviewCount,
      imageUrl: pharmacy.imageUrl,
      description: pharmacy.description,
      services: pharmacy.services,
      paymentMethods: pharmacy.paymentMethods,
      parkingInfo: pharmacy.parkingInfo,
      createdAt: pharmacy.createdAt.toISOString(),
      updatedAt: pharmacy.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching pharmacist profile:', error);
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
    const {
      name,
      address,
      city,
      district,
      phone,
      email,
      openTime,
      closeTime,
      description,
      services,
      paymentMethods,
      parkingInfo,
      isGuard,
      isOpen24h,
      latitude,
      longitude,
      imageUrl,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (openTime !== undefined) updateData.openTime = openTime;
    if (closeTime !== undefined) updateData.closeTime = closeTime;
    if (description !== undefined) updateData.description = description;
    if (services !== undefined) {
      updateData.services = typeof services === 'string' ? services : JSON.stringify(services);
    }
    if (paymentMethods !== undefined) {
      updateData.paymentMethods =
        typeof paymentMethods === 'string' ? paymentMethods : JSON.stringify(paymentMethods);
    }
    if (parkingInfo !== undefined) updateData.parkingInfo = parkingInfo;
    if (isGuard !== undefined) updateData.isGuard = isGuard;
    if (isOpen24h !== undefined) updateData.isOpen24h = isOpen24h;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const updated = await db.pharmacy.update({
      where: { id: user.linkedPharmacyId },
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
    logger.error('Error updating pharmacist profile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
