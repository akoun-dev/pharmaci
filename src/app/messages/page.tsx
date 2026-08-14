"use client";

import { PatientSidebar } from "@/components/admin-sidebar";
import { MessagesScreen } from "@/components/screens/messages-screen";

export default function MessagesPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <PatientSidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
        <MessagesScreen />
      </main>
    </div>
  );
}
