'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  MapPin,
  Clock,
  Shield,
  Star,
  Heart,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Pill,
  Navigation,
  Car,
  CreditCard,
  ParkingCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewHeader } from '@/components/view-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from '@/components/rating-stars';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';
import { openGoogleMaps, openWaze, PAYMENT_LABELS, PAYMENT_ICONS } from '@/lib/navigation';

interface PharmacyDetail {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  phone: string;
  email?: string;
  isGuard: boolean;
  isOpen24h: boolean;
  openTime: string;
  closeTime: string;
  rating: number;
  reviewCount: number;
  description?: string;
  services: string[];
  paymentMethods: string;
  parkingInfo?: string | null;
  latitude: number;
  longitude: number;
  isFavorite: boolean;
  reviews: Review[];
  stocks: Stock[];
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { id: string; name: string; avatar?: string };
}

interface Stock {
  id: string;
  price: number;
  inStock: boolean;
  quantity: number;
  medication: {
    id: string;
    name: string;
    commercialName: string;
    category?: string;
    form?: string;
  };
}

function isOpen(openTime: string, closeTime: string, is24h: boolean): boolean {
  if (is24h) return true;
  const now = new Date();
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

export function PharmacyDetailView() {
  const {
    selectedPharmacyId,
    currentUserId,
    setCurrentView,
    selectMedication,
  } = useAppStore();

  const [pharmacy, setPharmacy] = useState<PharmacyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllMedications, setShowAllMedications] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isFav, setIsFav] = useState(false);

  const fetchPharmacy = useCallback(async () => {
    if (!selectedPharmacyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacies/${selectedPharmacyId}?userId=${currentUserId || ''}`);
      const data = await res.json();
      setPharmacy(data);
      setIsFav(data.isFavorite || false);
    } catch (error) {
      logger.error('Error fetching pharmacy:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [selectedPharmacyId, currentUserId]);

  useEffect(() => {
    fetchPharmacy();
  }, [fetchPharmacy]);

  const handleToggleFavorite = async () => {
    if (!currentUserId) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      return;
    }
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, pharmacyId: selectedPharmacyId }),
      });
      setIsFav(!isFav);
      toast.success(isFav ? 'Retiré des favoris' : 'Ajouté aux favoris');
    } catch {
      toast.error('Erreur');
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUserId || !selectedPharmacyId) return;
    setSubmittingReview(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          pharmacyId: selectedPharmacyId,
          rating: newReviewRating,
          comment: newReviewComment,
        }),
      });
      toast.success('Avis publié avec succès!');
      setShowReviewForm(false);
      setNewReviewComment('');
      setNewReviewRating(5);
      fetchPharmacy();
    } catch {
      toast.error('Erreur lors de la publication');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMedicationClick = (id: string) => {
    selectMedication(id);
    setCurrentView('medication-detail');
  };

  const handleNavigate = () => {
    if (pharmacy) {
      openGoogleMaps(pharmacy.latitude, pharmacy.longitude, pharmacy.name);
    }
  };

  const handleWaze = () => {
    if (pharmacy) {
      openWaze(pharmacy.latitude, pharmacy.longitude);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-center">
        <p className="text-muted-foreground">Pharmacie non trouvée</p>
      </div>
    );
  }

  const open = isOpen(pharmacy.openTime, pharmacy.closeTime, pharmacy.isOpen24h);
  const inStockMeds = pharmacy.stocks.filter((s) => s.inStock);
  const displayedMeds = showAllMedications ? pharmacy.stocks : pharmacy.stocks.slice(0, 5);
  const displayedReviews = showAllReviews ? pharmacy.reviews : pharmacy.reviews.slice(0, 3);
  const paymentMethods: string[] = (() => {
    try { return JSON.parse(pharmacy.paymentMethods || '[]'); } catch { return []; }
  })();

  // Rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: pharmacy.reviews.filter((rev) => rev.rating === r).length,
    pct: pharmacy.reviews.length
      ? Math.round(
          (pharmacy.reviews.filter((rev) => rev.rating === r).length /
            pharmacy.reviews.length) *
            100
        )
      : 0,
  }));

  return (
    <div className="pb-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ViewHeader title="Détails de la pharmacie" back />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-emerald-100">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 sm:px-4 py-3 sm:py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h1 className="text-base sm:text-lg font-bold text-white break-words">{pharmacy.name}</h1>
                    {pharmacy.isGuard && (
                      <Badge className="bg-amber-500 text-white text-[10px] h-5 flex items-center gap-0.5 flex-shrink-0">
                        <Shield className="h-3 w-3" />
                        Garde
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                    <RatingStars rating={pharmacy.rating} size={12} />
                    <span className="text-emerald-200 text-[11px] sm:text-xs">
                      {pharmacy.rating.toFixed(1)} ({pharmacy.reviewCount} avis)
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleToggleFavorite}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0"
                >
                  <Heart
                    className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`}
                  />
                </button>
              </div>
            </div>

            <CardContent className="p-3 sm:p-4 space-y-3">
              {/* Contact info */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="break-words">
                    {pharmacy.address}, {pharmacy.district}, {pharmacy.city}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a href={`tel:${pharmacy.phone}`} className="text-emerald-600 hover:underline">
                    {pharmacy.phone}
                  </a>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-wrap">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>
                    {pharmacy.isOpen24h
                      ? 'Ouvert 24h/24'
                      : `${pharmacy.openTime} - ${pharmacy.closeTime}`}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      open
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                        : 'border-red-300 text-red-700 bg-red-50'
                    }`}
                  >
                    {open ? 'Ouvert' : 'Fermé'}
                  </Badge>
                </div>
              </div>

              {/* Services */}
              {pharmacy.services && pharmacy.services.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-1">
                  {pharmacy.services.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="text-[10px] bg-emerald-50 text-emerald-700 capitalize"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Description */}
              {pharmacy.description && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {pharmacy.description}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Practical Info: Payment methods + Parking */}
        {(paymentMethods.length > 0 || pharmacy.parkingInfo) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 sm:mt-4"
          >
            <Card className="border-emerald-100">
              <CardContent className="p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  <h3 className="font-semibold text-sm">Infos pratiques</h3>
                </div>

                {/* Payment methods */}
                {paymentMethods.length > 0 && (
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">Moyens de paiement acceptés</p>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {paymentMethods.map((pm: string) => (
                        <Badge
                          key={pm}
                          variant="outline"
                          className="text-[10px] sm:text-xs border-emerald-200 text-emerald-700 bg-emerald-50/50 px-1.5 sm:px-2 py-0.5 sm:py-1 gap-1"
                        >
                          <span>{PAYMENT_ICONS[pm] || '💳'}</span>
                          {PAYMENT_LABELS[pm] || pm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parking info */}
                {pharmacy.parkingInfo && (
                  <div className="flex items-start gap-2 bg-emerald-50 rounded-lg p-2.5 sm:p-3">
                    <ParkingCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-medium text-emerald-800">Parking</p>
                      <p className="text-[11px] sm:text-xs text-emerald-700 mt-0.5 break-words">{pharmacy.parkingInfo}</p>
                    </div>
                  </div>
                )}

                {/* Waze alternative */}
                <button
                  onClick={handleWaze}
                  className="w-full flex items-center justify-center gap-2 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg py-2 transition-colors"
                >
                  <Car className="h-3.5 w-3.5" />
                  Ouvrir avec Waze
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Available Medications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 sm:mt-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Pill className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              <h2 className="font-semibold text-sm">Médicaments disponibles</h2>
            </div>
            <Badge variant="secondary" className="text-[10px] sm:text-xs">
              {inStockMeds.length}/{pharmacy.stocks.length} en stock
            </Badge>
          </div>

          <div className="space-y-2">
            {displayedMeds.map((stock) => (
              <Card
                key={stock.id}
                className="overflow-hidden border-emerald-100 cursor-pointer hover:border-emerald-300 transition-colors"
                onClick={() => handleMedicationClick(stock.medication.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm">{stock.medication.name}</span>
                        {stock.inStock ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 h-4">
                            En stock
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 h-4">
                            Rupture
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {stock.medication.commercialName} • {stock.medication.form}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm text-emerald-700">
                        {stock.price.toLocaleString()} FCFA
                      </p>
                      {stock.inStock && (
                        <p className="text-[10px] text-muted-foreground">Qté: {stock.quantity}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pharmacy.stocks.length > 5 && (
            <Button
              variant="ghost"
              className="w-full mt-2 text-emerald-600 text-xs sm:text-sm"
              onClick={() => setShowAllMedications(!showAllMedications)}
            >
              {showAllMedications ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Voir moins
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Voir les {pharmacy.stocks.length - 5} autres
                </>
              )}
            </Button>
          )}
        </motion.div>

        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 sm:mt-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              <h2 className="font-semibold text-sm">Avis ({pharmacy.reviews.length})</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-emerald-200 text-emerald-700"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              Écrire un avis
            </Button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <Card className="mb-2 sm:mb-3 border-emerald-100">
              <CardContent className="p-3 sm:p-4 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Votre note</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button key={r} onClick={() => setNewReviewRating(r)} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Star
                          className={`h-6 w-6 ${
                            r <= newReviewRating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Partagez votre expérience..."
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !newReviewComment}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                  >
                    {submittingReview ? 'Publication...' : 'Publier'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating breakdown */}
          {pharmacy.reviews.length > 0 && (
            <Card className="mb-2 sm:mb-3 border-emerald-100">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-center flex-shrink-0">
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{pharmacy.rating.toFixed(1)}</p>
                    <RatingStars rating={pharmacy.rating} size={12} />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {pharmacy.reviews.length} avis
                    </p>
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    {ratingBreakdown.map((rb) => (
                      <div key={rb.rating} className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] text-muted-foreground w-3">{rb.rating}</span>
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-0">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${rb.pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-5 text-right flex-shrink-0">{rb.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review list */}
          <div className="space-y-2">
            {displayedReviews.map((review) => (
              <Card key={review.id} className="border-emerald-100">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-medium text-sm truncate">{review.user.name}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <RatingStars rating={review.rating} size={12} />
                  {review.comment && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {pharmacy.reviews.length > 3 && (
            <Button
              variant="ghost"
              className="w-full mt-2 text-emerald-600 text-xs sm:text-sm"
              onClick={() => setShowAllReviews(!showAllReviews)}
            >
              {showAllReviews ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Voir moins
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Voir tous les avis
                </>
              )}
            </Button>
          )}
        </motion.div>
      </div>

      {/* Fixed bottom: Call + Navigate */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px)+0.5rem)] left-0 right-0 z-40 lg:bottom-6 lg:left-64 lg:right-0 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-2">
          <a
            href={`tel:${pharmacy.phone}`}
            className="flex items-center justify-center gap-2 h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-600/30 font-semibold text-sm transition-colors"
          >
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            Appeler
          </a>
          <button
            onClick={handleNavigate}
            className="flex items-center justify-center gap-2 h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/30 font-semibold text-sm transition-colors"
          >
            <Navigation className="h-4 w-4 sm:h-5 sm:w-5" />
            Y aller
          </button>
        </div>
      </div>
    </div>
  );
}
