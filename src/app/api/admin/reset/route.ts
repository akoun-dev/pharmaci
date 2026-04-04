import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';

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

    // Get the admin user IDs (keep them)
    const adminUsers = await db.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });
    const adminIds = adminUsers.map((u) => u.id);

    // Delete in order respecting FK constraints:
    // 1. StockHistory (references Pharmacy, Medication)
    const deletedStockHistory = await db.stockHistory.deleteMany();

    // 2. PharmacyMedication / stocks (references Pharmacy, Medication)
    const deletedStocks = await db.pharmacyMedication.deleteMany();

    // 3. Orders (references User, Pharmacy, Medication)
    const deletedOrders = await db.order.deleteMany();

    // 4. Reviews (references User, Pharmacy)
    const deletedReviews = await db.review.deleteMany();

    // 5. Favorites (references User, Pharmacy)
    const deletedFavorites = await db.favorite.deleteMany();

    // 6. Messages (references User as sender/receiver)
    const deletedMessages = await db.message.deleteMany();

    // 7. Notifications (references User) — keep admin notifications
    const deletedNotifications = await db.notification.deleteMany({
      where: { userId: { notIn: adminIds } },
    });

    // 8. SearchHistory (references User) — keep admin history
    const deletedSearchHistory = await db.searchHistory.deleteMany({
      where: { userId: { notIn: adminIds } },
    });

    // 9. MedicationAlternative (references Medication)
    const deletedAlternatives = await db.medicationAlternative.deleteMany();

    // 10. Medications
    const deletedMedications = await db.medication.deleteMany();

    // 11. Promotions (references Pharmacy, Medication)
    const deletedPromotions = await db.promotion.deleteMany();

    // 12. Pharmacies
    const deletedPharmacies = await db.pharmacy.deleteMany();

    // 13. Non-admin users
    const deletedUsers = await db.user.deleteMany({
      where: { id: { notIn: adminIds } },
    });

    // Reset notification preferences for admin users
    for (const adminId of adminIds) {
      await db.user.update({
        where: { id: adminId },
        data: {
          notificationPreferences: '{}',
          linkedPharmacyId: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Données réinitialisées avec succès',
      deleted: {
        orders: deletedOrders.count,
        reviews: deletedReviews.count,
        favorites: deletedFavorites.count,
        messages: deletedMessages.count,
        notifications: deletedNotifications.count,
        searchHistory: deletedSearchHistory.count,
        stocks: deletedStocks.count,
        stockHistory: deletedStockHistory.count,
        medications: deletedMedications.count,
        alternatives: deletedAlternatives.count,
        promotions: deletedPromotions.count,
        pharmacies: deletedPharmacies.count,
        users: deletedUsers.count,
      },
    });
  } catch (error) {
    logger.error('Error resetting data:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
