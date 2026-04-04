'use client';

import { logger } from '@/lib/logger';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function RatingStars({
  rating,
  maxStars = 5,
  size = 16,
  showValue = false,
  className = '',
}: RatingStarsProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const safeRating = rating || 0;
        const fill = Math.min(1, Math.max(0, safeRating - i));
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            <Star
              size={size}
              className="text-muted-foreground/30 fill-muted-foreground/30"
            />
            {fill > 0 && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star
                  size={size}
                  className="text-amber-500 fill-amber-500"
                />
              </div>
            )}
          </div>
        );
      })}
      {showValue && rating != null && (
        <span className="text-xs font-medium text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
