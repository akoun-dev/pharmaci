'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronsLeft, ChevronsRight, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartPaginationProps {
  /** Page actuelle (commence à 1) */
  currentPage: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Callback lors du changement de page */
  onPageChange: (page: number) => void;
  /** Nombre total d'éléments (optionnel, pour l'affichage d'info) */
  total?: number;
  /** Nombre d'éléments par page (optionnel, pour l'affichage d'info) */
  pageSize?: number;
  /** Classe CSS personnalisée */
  className?: string;
  /** Couleur theme (amber par défaut pour admin, peut être overridé) */
  theme?: 'amber' | 'orange' | 'indigo' | 'gray';
}

const THEME_CLASSES = {
  amber: {
    border: 'border-amber-200',
    text: 'text-amber-700',
    hover: 'hover:bg-amber-50',
    bg: 'bg-amber-600',
    bgDisabled: 'disabled:opacity-40',
  },
  orange: {
    border: 'border-orange-200',
    text: 'text-orange-700',
    hover: 'hover:bg-orange-50',
    bg: 'bg-orange-600',
    bgDisabled: 'disabled:opacity-40',
  },
  indigo: {
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    hover: 'hover:bg-indigo-50',
    bg: 'bg-indigo-600',
    bgDisabled: 'disabled:opacity-40',
  },
  gray: {
    border: 'border-gray-200',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-50',
    bg: 'bg-gray-600',
    bgDisabled: 'disabled:opacity-40',
  },
};

export function SmartPagination({
  currentPage,
  totalPages,
  onPageChange,
  total,
  pageSize,
  className,
  theme = 'amber',
}: SmartPaginationProps) {
  const classes = THEME_CLASSES[theme];

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  // Génération des numéros de pages avec ellipsis
  const pageNumbers: (number | string)[] = [];
  const maxVisible = 5;
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  if (start > 1) {
    pageNumbers.push(1);
    if (start > 2) pageNumbers.push('...');
  }
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }
  if (end < totalPages) {
    if (end < totalPages - 1) pageNumbers.push('...');
    pageNumbers.push(totalPages);
  }

  // Ne pas afficher la pagination si une seule page
  if (totalPages <= 1) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Contrôles de pagination */}
      <div className="flex items-center justify-center gap-1.5">
        {/* Première page */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-9 w-9',
            classes.border,
            classes.text,
            classes.hover,
            classes.bgDisabled
          )}
          disabled={!hasPrev}
          onClick={() => goToPage(1)}
          aria-label="Première page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Page précédente */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-9 w-9',
            classes.border,
            classes.text,
            classes.hover,
            classes.bgDisabled
          )}
          disabled={!hasPrev}
          onClick={() => goToPage(currentPage - 1)}
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Numéros de pages */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, idx) =>
            typeof page === 'string' ? (
              <span
                key={`dots-${idx}`}
                className="text-xs text-muted-foreground px-1"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={cn(
                  'h-9 w-9 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
                  page === currentPage
                    ? cn(classes.bg, 'text-white shadow-sm')
                    : cn(classes.hover, classes.text)
                )}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Page suivante */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-9 w-9',
            classes.border,
            classes.text,
            classes.hover,
            classes.bgDisabled
          )}
          disabled={!hasNext}
          onClick={() => goToPage(currentPage + 1)}
          aria-label="Page suivante"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>

        {/* Dernière page */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-9 w-9',
            classes.border,
            classes.text,
            classes.hover,
            classes.bgDisabled
          )}
          disabled={!hasNext}
          onClick={() => goToPage(totalPages)}
          aria-label="Dernière page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Info: X–Y sur Z éléments */}
      {total && pageSize && total > 0 && (
        <p className="text-center text-[11px] text-muted-foreground">
          {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} sur {total}{' '}
          éléments
        </p>
      )}
    </div>
  );
}
