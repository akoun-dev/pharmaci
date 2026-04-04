import { logger } from '@/lib/logger';
import { Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
        <Pill className="h-8 w-8 text-emerald-600" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Page introuvable</h1>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        La page que vous recherchez n&apos;existe pas.
      </p>
      <a href="/">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          Retour à l&apos;accueil
        </Button>
      </a>
    </div>
  );
}
