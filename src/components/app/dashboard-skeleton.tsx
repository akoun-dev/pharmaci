"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton placeholder shown while a dashboard is loading.
 * Mimics the layout of the KPI grid + chart + action list.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Header area */}
      <div className="px-4 pt-2 pb-3 flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
            <Skeleton className="h-7 w-16 rounded-full mb-1.5" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="mx-4 mt-4 rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-3 w-40 rounded-full mb-3" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>

      {/* Quick actions placeholder */}
      <div className="px-4 mt-6 space-y-2">
        <Skeleton className="h-3 w-28 rounded-full mb-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-3 w-40 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
