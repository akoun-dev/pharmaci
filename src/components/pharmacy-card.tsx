'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Star, ShieldCheck, Heart } from 'lucide-react';
import { RatingStars } from '@/components/rating-stars';
import { motion } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface PharmacyCardProps {
  pharmacy: {
    id: string;
    name: string;
    address: string;
    city: string;
    district?: string;
    phone: string;
    rating: number;
    reviewCount: number;
    isGuard: boolean;
    isOpen24h: boolean;
    openTime: string;
    closeTime: string;
    services: string[];
    isFavorite?: boolean;
  };
  onClick: (id: string) => void;
  showServices?: boolean;
  compact?: boolean;
  distance?: number | null;
  onFavoriteChange?: (pharmacyId: string, isFavorite: boolean) => void;
}

function isOpen(openTime?: string, closeTime?: string, is24h?: boolean): boolean {
  if (is24h) return true;
  if (!openTime || !closeTime) return false;
  const now = new Date();
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

export const PharmacyCard = React.memo(function PharmacyCard({
  pharmacy,
  onClick,
  showServices = true,
  compact = false,
  distance,
  onFavoriteChange,
}: PharmacyCardProps) {
  const [isFav, setIsFav] = useState(pharmacy.isFavorite || false);
  const open = isOpen(pharmacy.openTime, pharmacy.closeTime, pharmacy.isOpen24h);

  // Sync local state when prop changes
  useEffect(() => {
    setIsFav(pharmacy.isFavorite || false);
  }, [pharmacy.isFavorite]);

  const handleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = isFav;
    setIsFav(!prev);

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacyId: pharmacy.id }),
      });
      if (!res.ok) {
        setIsFav(prev);
        toast.error('Erreur lors de la mise à jour du favori');
        return;
      }
      const data = await res.json();
      setIsFav(data.isFavorite);
      toast.success(data.isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
      // Notify parent so it can refetch data if needed
      onFavoriteChange?.(pharmacy.id, data.isFavorite);
    } catch {
      setIsFav(prev);
      toast.error('Erreur réseau');
    }
  }, [isFav, pharmacy.id, onFavoriteChange]);

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border-orange-100 hover:border-orange-300"
        onClick={() => onClick(pharmacy.id)}
      >
        <CardContent className={compact ? 'p-3' : 'p-3 sm:p-4'}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {pharmacy.name}
                </h3>
                {pharmacy.isGuard && (
                  <Badge variant="default" className="bg-orange-600 text-white text-[10px] px-1.5 py-0 h-5 flex items-center gap-0.5 flex-shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    De garde
                  </Badge>
                )}
                {pharmacy.isOpen24h && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 flex items-center gap-0.5 bg-amber-100 text-amber-700 border-amber-200 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    24h/24
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {pharmacy.address}, {pharmacy.city}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <RatingStars rating={pharmacy.rating} size={12} showValue />
                <span className="text-[11px] text-muted-foreground">
                  ({pharmacy.reviewCount})
                </span>
                <span className={`text-[11px] font-medium ${open ? 'text-orange-600' : 'text-red-500'}`}>
                  {open ? 'Ouvert' : 'Fermé'}
                </span>
                {distance != null && (
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">
                    {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleFavorite}
              className="flex-shrink-0 p-1.5 hover:bg-muted rounded-full transition-colors"
              aria-label="Favori"
            >
              <Heart
                className={`h-5 w-5 transition-colors duration-200 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
              />
            </button>
          </div>

          {showServices && pharmacy.services && pharmacy.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 sm:mt-3">
              {pharmacy.services.slice(0, 4).map((service: string) => (
                <Badge
                  key={service}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-orange-200 text-orange-700 capitalize"
                >
                  {service}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
