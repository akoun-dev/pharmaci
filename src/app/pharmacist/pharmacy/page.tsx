'use client';

import { PharmacistSidebar } from '@/components/admin-sidebar';

export default function PharmacistPharmacyPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <PharmacistSidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Gestion de la Pharmacie</h1>
          <p className="text-gray-600">Gérez les informations de votre pharmacie.</p>
        </div>
      </main>
    </div>
  );
}
