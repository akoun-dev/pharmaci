"use client";

import { PatientSidebar } from "@/components/admin-sidebar";
import { HomeScreen } from "@/components/screens/home-screen";

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <PatientSidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
        <HomeScreen />
      </main>
    </div>
  );
}
