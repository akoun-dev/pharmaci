'use client';

import { logger } from '@/lib/logger';
import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface ViewHeaderProps {
  title: string;
  icon?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  action?: ReactNode;
}

export function ViewHeader({ title, icon, back, onBack, action }: ViewHeaderProps) {
  const { goBack } = useAppStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center gap-2 pt-1 pb-3">
      {back && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 -ml-1 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 active:bg-orange-100 transition-colors flex-shrink-0"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      {icon && (
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex-shrink-0">
          {icon}
        </div>
      )}
      <h1 className="text-lg font-bold text-foreground flex-1 min-w-0 truncate">{title}</h1>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
