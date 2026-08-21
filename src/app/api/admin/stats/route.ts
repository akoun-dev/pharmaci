import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const roleGuard = await requireRole("ADMIN");
  if (!roleGuard.ok) return roleGuard.error;

  const [
    totalUsers,
    totalPatients,
    totalPharmacists,
    totalAdmins,
    totalPharmacies,
    verifiedPharmacies,
    totalMedications,
    totalOrders,
    totalRevenue,
    pendingOrders,
    recentOrders,
    recentUsers,
    topPharmacies,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "PATIENT" } }),
    db.user.count({ where: { role: "PHARMACIST" } }),
    db.user.count({ where: { role: "ADMIN" } }),
    db.pharmacy.count(),
    db.pharmacy.count({ where: { isVerified: true } }),
    db.medication.count(),
    db.order.count(),
    db.order.aggregate({
      where: { status: { in: ["CONFIRMED", "READY", "PICKED_UP"] } },
      _sum: { totalAmount: true },
    }),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { id: true, name: true } },
        pharmacy: { select: { id: true, name: true } },
      },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    db.pharmacy.findMany({
      orderBy: { rating: "desc" },
      take: 5,
      select: { id: true, name: true, city: true, rating: true, reviewCount: true },
    }),
  ]);

  return NextResponse.json({
    users: {
      total: totalUsers,
      patients: totalPatients,
      pharmacists: totalPharmacists,
      admins: totalAdmins,
    },
    pharmacies: {
      total: totalPharmacies,
      verified: verifiedPharmacies,
    },
    medications: totalMedications,
    orders: {
      total: totalOrders,
      pending: pendingOrders,
    },
    revenue: totalRevenue._sum.totalAmount || 0,
    recentOrders,
    recentUsers,
    topPharmacies,
  });
}
