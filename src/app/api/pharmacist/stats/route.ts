import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PHARMACIST") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const pharmacy = await db.pharmacy.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!pharmacy) {
    return NextResponse.json({ error: "Aucune pharmacie associée" }, { status: 404 });
  }

  const pharmacyId = pharmacy.id;

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    readyOrders,
    pickedUpOrders,
    cancelledOrders,
    totalRevenue,
    totalStockItems,
    allStocks,
    totalReviews,
    avgRating,
    totalMedications,
    recentOrders,
  ] = await Promise.all([
    db.order.count({ where: { pharmacyId } }),
    db.order.count({ where: { pharmacyId, status: "PENDING" } }),
    db.order.count({ where: { pharmacyId, status: "CONFIRMED" } }),
    db.order.count({ where: { pharmacyId, status: "READY" } }),
    db.order.count({ where: { pharmacyId, status: "PICKED_UP" } }),
    db.order.count({ where: { pharmacyId, status: "CANCELLED" } }),
    db.order.aggregate({
      where: { pharmacyId, status: { in: ["CONFIRMED", "READY", "PICKED_UP"] } },
      _sum: { totalAmount: true },
    }),
    db.pharmacyMedication.count({ where: { pharmacyId } }),
    db.pharmacyMedication.findMany({
      where: { pharmacyId },
      select: { stock: true, lowStockThreshold: true },
    }),
    db.review.count({ where: { pharmacyId } }),
    db.review.aggregate({ where: { pharmacyId }, _avg: { rating: true } }),
    db.pharmacyMedication.count({ where: { pharmacyId, stock: { gt: 0 } } }),
    db.order.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { id: true, name: true } },
        items: { include: { medication: { select: { name: true } } } },
      },
    }),
  ]);

  const lowStockItems = allStocks.filter((s) => s.stock <= s.lowStockThreshold).length;

  return NextResponse.json({
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      confirmed: confirmedOrders,
      ready: readyOrders,
      pickedUp: pickedUpOrders,
      cancelled: cancelledOrders,
    },
    revenue: totalRevenue._sum.totalAmount || 0,
    stock: {
      totalItems: totalStockItems,
      lowStock: lowStockItems,
      inStock: totalMedications,
    },
    reviews: {
      total: totalReviews,
      average: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : 0,
    },
    recentOrders,
  });
}
