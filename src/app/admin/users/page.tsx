'use client';

import { AdminSidebar } from '@/components/admin-sidebar';
import { UsersScreen } from '@/components/screens/users-screen';

export default function AdminUsersPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar role="ADMIN" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
        <UsersScreen />
      </main>
    </div>
  );
}
