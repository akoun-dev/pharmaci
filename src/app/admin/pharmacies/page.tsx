'use client';

import { AdminSidebar } from '@/components/admin-sidebar';
import { PharmaciesScreen } from '@/components/screens/pharmacies-screen';

export default function AdminPharmaciesPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar role="ADMIN" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
        <PharmaciesScreen />
      </main>
    </div>
  );
}
