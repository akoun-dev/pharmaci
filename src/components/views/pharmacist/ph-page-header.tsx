'use client';

import type { ReactNode } from 'react';

interface PharmacistPageHeaderProps {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
}

export function PharmacistPageHeader({
  title,
  description,
  icon,
  action,
}: PharmacistPageHeaderProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 px-5 py-5 text-white dark:from-amber-900 dark:to-amber-950 dark:ring-1 dark:ring-amber-800/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/14 text-white dark:bg-white/10">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-100 dark:text-amber-200">Espace pharmacien</p>
              <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-amber-100 dark:text-amber-200">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
