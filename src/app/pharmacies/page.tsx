"use client";

import { PatientSidebar } from "@/components/admin-sidebar";
import { PharmacySearchScreen } from "@/components/screens/pharmacy-search-screen";

export default function PharmaciesPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <PatientSidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
        <PharmacySearchScreen />
      </main>
    </div>
  );
}
