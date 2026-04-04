'use client';
import { logger } from '@/lib/logger';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Une erreur est survenue</h1>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Veuillez réessayer ou revenir à l&apos;accueil.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Réessayer
        </Button>
        <a href="/">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Accueil
          </Button>
        </a>
      </div>
    </div>
  );
}
