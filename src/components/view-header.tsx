'use client';

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
    <div className="flex items-center gap-2 pt-1 pb-3">
      {back && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 -ml-1 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:bg-emerald-100 transition-colors flex-shrink-0"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      {icon && (
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex-shrink-0">
          {icon}
        </div>
      )}
      <h1 className="text-lg font-bold text-foreground flex-1 min-w-0 truncate">{title}</h1>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
