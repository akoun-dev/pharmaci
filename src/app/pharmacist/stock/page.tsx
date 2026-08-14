'use client';

import { PharmacistSidebar } from '@/components/admin-sidebar';
import { StockScreen } from '@/components/screens/stock-screen';

export default function PharmacistStockPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <PharmacistSidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
        <StockScreen />
      </main>
    </div>
  );
}
