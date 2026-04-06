'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Trash2,
  MessageSquare,
  Pill,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingStars } from '@/components/rating-stars';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

export function FavoritesView() {
  const {
    currentUserId,
    setCurrentView,
    selectPharmacy,
  } = useAppStore();

  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/favorites?userId=${currentUserId}`);
      const data = await res.json();
      setFavorites(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (pharmacyId: string) => {
    if (!currentUserId) return;
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, pharmacyId }),
      });
      setFavorites(favorites.filter((f) => f.pharmacyId !== pharmacyId));
      toast.success('Retiré des favoris');
    } catch {
      toast.error('Erreur');
    }
  };

  const handlePharmacyClick = (id: string) => {
    selectPharmacy(id);
    setCurrentView('pharmacy-detail');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ViewHeader title="Mes Favoris" icon={<Heart className="h-5 w-5 text-amber-600" />} action={
          currentUserId && favorites.length > 0 ? (
            <Badge variant="secondary" className="text-xs">
              {favorites.length}
            </Badge>
          ) : null
        } />

        {!currentUserId ? (
          <Card className="border-amber-100">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="flex justify-center mb-3">
                <Lock className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-1">Connectez-vous</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connectez-vous pour voir vos favoris
              </p>
              <Button
                onClick={() => setCurrentView('profile')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Se connecter
              </Button>
            </CardContent>
          </Card>
        ) : favorites.length === 0 ? (
          <Card className="border-amber-100">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="text-4xl mb-3 flex justify-center">
                <Pill className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-1">Aucun favori</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez des pharmacies à vos favoris pour les retrouver facilement
              </p>
              <Button
                onClick={() => setCurrentView('search')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Explorer les pharmacies
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            <div className="space-y-2 sm:space-y-3">
              {favorites.map((fav, index) => (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="border-amber-100 cursor-pointer hover:border-amber-300 transition-colors"
                    onClick={() => handlePharmacyClick(fav.pharmacyId)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-semibold text-sm">{fav.pharmacy.name}</h3>
                            {fav.pharmacy.isGuard && (
                              <Badge className="bg-amber-600 text-white text-[10px] px-1.5 h-4 flex-shrink-0">
                                <ShieldCheck className="h-3 w-3" />
                                De garde
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {fav.pharmacy.address}, {fav.pharmacy.city}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-3 mt-2 flex-wrap">
                            <RatingStars rating={fav.pharmacy.rating} size={12} showValue />
                            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{fav.pharmacy.phone}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFavorite(fav.pharmacyId);
                          }}
                          className="p-2 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
