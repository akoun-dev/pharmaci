'use client';

import { PharmacistSidebar } from '@/components/admin-sidebar';

export default function PharmacistDashboardPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <PharmacistSidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Tableau de bord Pharmacien</h1>
          <p className="text-gray-600">Gérez votre stock, commandes et pharmacie.</p>
        </div>
      </main>
    </div>
  );
}
