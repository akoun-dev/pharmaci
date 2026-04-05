'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MapPin,
  Phone,
  Shield,
  Trash2,
  MessageSquare,
  Building2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from '@/components/rating-stars';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

export function MyReviewsView() {
  const {
    currentUserId,
    setCurrentView,
    selectPharmacy,
  } = useAppStore();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/users/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      logger.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!currentUserId) return;
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReviews(reviews.filter((r) => r.id !== reviewId));
        toast.success('Avis supprimé');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setDeletingId(null);
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
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ViewHeader
          title="Mes Avis"
          icon={<Star className="h-5 w-5 text-emerald-600" />}
          action={
            currentUserId && reviews.length > 0 ? (
              <Badge variant="secondary" className="text-xs">
                {reviews.length}
              </Badge>
            ) : null
          }
        />

        {!currentUserId ? (
          <Card className="border-emerald-100">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="text-4xl mb-3">🔐</div>
              <h3 className="font-semibold mb-1">Connectez-vous</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connectez-vous pour voir vos avis
              </p>
              <Button
                onClick={() => setCurrentView('profile')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Se connecter
              </Button>
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="border-emerald-100">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="text-4xl mb-3 flex justify-center">
                <MessageSquare className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="font-semibold mb-1">Aucun avis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Vous n&apos;avez pas encore laissé d&apos;avis sur les pharmacies
              </p>
              <Button
                onClick={() => setCurrentView('search')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Découvrir les pharmacies
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            <div className="space-y-2 sm:space-y-3">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-emerald-100">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handlePharmacyClick(review.pharmacyId)}
                        >
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <Building2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                            <h3 className="font-semibold text-sm">{review.pharmacy.name}</h3>
                            {review.pharmacy.isGuard && (
                              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 h-4 flex-shrink-0">
                                <Shield className="h-3 w-3" />
                                Garde
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {review.pharmacy.address}, {review.pharmacy.city}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingId === review.id}
                          className="p-2 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-50"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <RatingStars rating={review.rating} size={14} />
                        <span className="text-xs text-muted-foreground">
                          {review.rating}/5
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-3">
                          {review.comment}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {review.reply && (
                        <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                            Réponse de la pharmacie
                          </p>
                          <p className="text-xs text-muted-foreground">{review.reply}</p>
                        </div>
                      )}
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
