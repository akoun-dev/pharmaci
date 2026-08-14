'use client';

import { AdminSidebar } from '@/components/admin-sidebar';

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar role="ADMIN" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Tableau de bord Administrateur</h1>
          <p className="text-gray-600">Gérez les utilisateurs, pharmacies et commandes.</p>
        </div>
      </main>
    </div>
  );
}
