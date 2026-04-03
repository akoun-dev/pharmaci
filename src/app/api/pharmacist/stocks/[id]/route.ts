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

    const { id } = await params;

    const stock = await db.pharmacyMedication.findFirst({
      where: { id, pharmacyId: user.linkedPharmacyId },
      include: {
        medication: true,
        pharmacy: true,
      },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock non trouvé' }, { status: 404 });
    }

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Error fetching pharmacist stock:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { price, quantity, inStock, needsPrescription, expirationDate } = body;

    // Fetch existing stock (scoped to user's pharmacy)
    const existing = await db.pharmacyMedication.findFirst({
      where: { id, pharmacyId: user.linkedPharmacyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Stock non trouvé' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    let historyType: string | null = null;
    let historyNote = '';
    let historyQuantity = 0;

    if (price !== undefined) {
      updateData.price = parseFloat(price);
    }

    if (needsPrescription !== undefined) {
      updateData.needsPrescription = needsPrescription;
    }

    if (expirationDate !== undefined) {
      updateData.expirationDate = expirationDate ? new Date(expirationDate) : null;
    }

    if (quantity !== undefined) {
      const newQty = parseInt(quantity, 10);
      const diff = newQty - existing.quantity;

      if (diff !== 0) {
        updateData.quantity = newQty;
        historyQuantity = Math.abs(diff);

        if (diff > 0) {
          historyType = 'entry';
          historyNote = `Réapprovisionnement: +${diff} unités`;
        } else {
          historyType = 'exit';
          historyNote = `Sortie: ${diff} unités`;
        }

        // Auto-toggle inStock based on quantity
        if (newQty === 0) {
          updateData.inStock = false;
          historyNote += ' | Rupture de stock';
        } else if (newQty > 0) {
          updateData.inStock = true;
        }
      }
    }

    if (inStock !== undefined && historyType !== 'entry' && historyType !== 'exit') {
      updateData.inStock = inStock;
      if (!historyType) {
        historyType = 'adjustment';
        historyNote = `Statut changé: ${inStock ? 'En stock' : 'Rupture'}`;
        historyQuantity = existing.quantity;
      }
    }

    const updatedStock = await db.pharmacyMedication.update({
      where: { id },
      data: updateData,
      include: {
        medication: true,
      },
    });

    // Create history entry if something changed
    if (historyType) {
      await db.stockHistory.create({
        data: {
          pharmacyId: existing.pharmacyId,
          medicationId: existing.medicationId,
          type: historyType,
          quantity: historyQuantity,
          note: historyNote,
        },
      });
    }

    return NextResponse.json(updatedStock);
  } catch (error) {
    console.error('Error updating pharmacist stock:', error);
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

    const { id } = await params;

    const existing = await db.pharmacyMedication.findFirst({
      where: { id, pharmacyId: user.linkedPharmacyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Stock non trouvé' }, { status: 404 });
    }

    await db.pharmacyMedication.delete({
      where: { id },
    });

    // Create exit history entry
    await db.stockHistory.create({
      data: {
        pharmacyId: existing.pharmacyId,
        medicationId: existing.medicationId,
        type: 'exit',
        quantity: existing.quantity,
        note: 'Médicament supprimé du stock',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pharmacist stock:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
