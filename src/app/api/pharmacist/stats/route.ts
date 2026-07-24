import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PHARMACIST") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const pharmacy = await db.pharmacy.findUnique({
    where: { ownerId: user.id },
    select: { id: true, name: true, rating: true, reviewCount: true },
  });

  if (!pharmacy) {
    return NextResponse.json({ error: "Aucune pharmacie associée" }, { status: 404 });
  }

  const pharmacyId = pharmacy.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "all"; // 'all' | 'month' | 'week'

  const dateFilter =
    period === "month"
      ? { gte: startOfMonth }
      : period === "week"
        ? { gte: startOfWeek }
        : undefined;

  const whereDate = dateFilter ? { createdAt: dateFilter } : {};

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    readyOrders,
    pickedUpOrders,
    cancelledOrders,
    totalRevenue,
    periodRevenue,
    totalStockItems,
    allStocks,
    totalReviews,
    avgRating,
    totalMedications,
    recentOrders,
    pharmacyName,
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
    db.order.aggregate({
      where: {
        pharmacyId,
        status: { in: ["CONFIRMED", "READY", "PICKED_UP"] },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      _sum: { totalAmount: true },
    }),
    db.pharmacyMedication.count({ where: { pharmacyId } }),
    db.pharmacyMedication.findMany({
      where: { pharmacyId },
      select: { stock: true, lowStockThreshold: true, expiryDate: true },
    }),
    db.review.count({ where: { pharmacyId } }),
    db.review.aggregate({ where: { pharmacyId }, _avg: { rating: true } }),
    db.pharmacyMedication.count({ where: { pharmacyId, stock: { gt: 0 } } }),
    db.order.findMany({
      where: { ...whereDate, pharmacyId } as any,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { id: true, name: true } },
        items: { include: { medication: { select: { name: true } } } },
      },
    }),
    Promise.resolve(pharmacy.name),
  ]);

  const lowStockItems = allStocks.filter((s) => s.stock <= s.lowStockThreshold).length;
  const expiringSoon = allStocks.filter((s) => {
    if (!s.expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(s.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  }).length;
  const expired = allStocks.filter((s) => {
    if (!s.expiryDate) return false;
    return new Date(s.expiryDate) < now;
  }).length;

  // Monthly revenue for chart (last 6 months)
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const result = await db.order.aggregate({
      where: {
        pharmacyId,
        status: { in: ["CONFIRMED", "READY", "PICKED_UP"] },
        createdAt: { gte: m, lt: end },
      },
      _sum: { totalAmount: true },
    });
    monthlyRevenue.push({
      month: m.toLocaleDateString("fr-FR", { month: "short" }),
      revenue: result._sum.totalAmount || 0,
    });
  }

  return NextResponse.json({
    pharmacyName,
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      confirmed: confirmedOrders,
      ready: readyOrders,
      pickedUp: pickedUpOrders,
      cancelled: cancelledOrders,
    },
    revenue: totalRevenue._sum.totalAmount || 0,
    revenueMonth: periodRevenue._sum.totalAmount || 0,
    monthlyRevenue,
    stock: {
      totalItems: totalStockItems,
      lowStock: lowStockItems,
      inStock: totalMedications,
      expiringSoon,
      expired,
    },
    reviews: {
      total: totalReviews,
      average: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : 0,
    },
    recentOrders,
  });
}
