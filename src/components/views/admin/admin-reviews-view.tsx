'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MessageSquare,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Inbox,
  X,
  Loader2,
  Building2,
  Reply,
  Send,
  Pencil,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ViewHeader } from '@/components/view-header';
import { toast } from 'sonner';
import { SmartPagination } from '@/components/ui/smart-pagination';
import { formatRelativeTime, formatDateFull } from '@/lib/date-utils';

// ── Types ──────────────────────────────────────────────────────────────────

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  reply: string | null;
  replyAt: string | null;
  createdAt: string;
  user: {
    name: string;
  };
  pharmacy: {
    name: string;
    city: string;
  };
}

interface RatingDistribution {
  [key: string]: number;
}

type ReplyFilter = 'all' | 'with_reply' | 'without_reply';

// ── Config ─────────────────────────────────────────────────────────────────

const RATING_TABS = [
  { key: 0, label: 'Toutes' },
  { key: 5, label: '5 ★' },
  { key: 4, label: '4 ★' },
  { key: 3, label: '3 ★' },
  { key: 2, label: '2 ★' },
  { key: 1, label: '1 ★' },
];

const REPLY_FILTER_OPTIONS: { key: ReplyFilter; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'with_reply', label: 'Avec réponse' },
  { key: 'without_reply', label: 'Sans réponse' },
];

const PAGE_SIZE = 20;

// ── Star Rating Display ────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconSize = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// ── Rating Distribution Bar ────────────────────────────────────────────────

function RatingDistributionBar({ distribution }: { distribution: RatingDistribution }) {
  const maxCount = Math.max(
    ...[5, 4, 3, 2, 1].map((r) => distribution[String(r)] || 0),
    1
  );

  // Compute average
  let sumRating = 0;
  let totalRatings = 0;
  for (const [star, count] of Object.entries(distribution)) {
    sumRating += Number(star) * count;
    totalRatings += count;
  }
  const avg = totalRatings > 0 ? (sumRating / totalRatings).toFixed(1) : '0.0';

  return (
    <Card className="border-amber-100 mb-4">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-700">{avg}</p>
            <StarRating rating={Math.round(Number(avg))} size="md" />
            <p className="text-[11px] text-muted-foreground mt-0.5">{totalRatings} avis</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[String(star)] || 0;
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3 text-right">{star}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: (5 - star) * 0.08 }}
                      className={`h-full rounded-full ${
                        star >= 4
                          ? 'bg-orange-400'
                          : star === 3
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminReviewsView() {
  // ── State ──
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRating, setActiveRating] = useState(0);
  const [replyFilter, setReplyFilter] = useState<ReplyFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Global rating distribution (fetched once on mount, re-fetched on delete)
  const [globalDistribution, setGlobalDistribution] = useState<RatingDistribution>({});

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ReviewData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Detail / Reply dialog
  const [detailReview, setDetailReview] = useState<ReviewData | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  // ── Fetch global distribution (no filters) ──
  const fetchGlobalDistribution = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reviews?limit=1&offset=0');
      if (res.ok) {
        const data = await res.json();
        setGlobalDistribution(data.ratingDistribution || {});
      }
    } catch {
      // silent
    }
  }, []);

  // Fetch global distribution on mount
  useEffect(() => {
    fetchGlobalDistribution();
  }, [fetchGlobalDistribution]);

  // ── Fetch reviews (list only, no distribution) ──
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((currentPage - 1) * PAGE_SIZE),
      });

      if (activeRating > 0) {
        params.set('rating', String(activeRating));
      }
      if (replyFilter !== 'all') {
        params.set('hasReply', replyFilter);
      }
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }

      const res = await fetch(`/api/admin/reviews?${params}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();

      setReviews(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
    } catch {
      setError('Impossible de charger les avis');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeRating, currentPage, replyFilter, searchQuery]);

  // Initial load and when filters change
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Reset to page 1 when filters change (except page)
  useEffect(() => {
    setCurrentPage(1);
  }, [activeRating, replyFilter, searchQuery]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchReviews();
    fetchGlobalDistribution();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveRating(0);
    setReplyFilter('all');
  };

  const hasActiveFilters = activeRating > 0 || replyFilter !== 'all' || searchQuery.trim().length > 0;

  // ── Pagination helpers ──
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ── Delete handler ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/reviews/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de suppression');
      }

      // Remove from local state
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setTotal((prev) => Math.max(0, prev - 1));

      // Re-fetch global distribution after delete
      fetchGlobalDistribution();

      toast.success('Avis supprimé avec succès');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Reply handler ──
  const handleSendReply = async () => {
    if (!detailReview || !replyText.trim()) return;

    try {
      setReplySending(true);
      const res = await fetch(`/api/admin/reviews/${detailReview.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la réponse');
      }

      const data = await res.json();

      // Update detail review locally
      setDetailReview({
        ...detailReview,
        reply: data.reply,
        replyAt: data.replyAt,
      });

      // Update the review in the list too
      setReviews((prev) =>
        prev.map((r) =>
          r.id === detailReview.id
            ? { ...r, reply: data.reply, replyAt: data.replyAt }
            : r
        )
      );

      toast.success(detailReview.reply ? 'Réponse modifiée avec succès' : 'Réponse envoyée avec succès');
      setReplyText('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      toast.error(message);
    } finally {
      setReplySending(false);
    }
  };

  // ── Open detail dialog ──
  const openDetail = (review: ReviewData) => {
    setDetailReview(review);
    // Pre-fill reply text if editing an existing reply
    setReplyText(review.reply || '');
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-9 w-16 flex-shrink-0 rounded-full" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <ViewHeader
          title="Gestion des avis"
          icon={<Star className="h-5 w-5 text-amber-600" />}
        />
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 pb-28">
      {/* ── Header ── */}
      <ViewHeader
        title="Gestion des avis"
        icon={<Star className="h-5 w-5 text-amber-600" />}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
              {total}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-amber-600"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {/* ── Rating Distribution Summary (global, not affected by filters) ── */}
      <RatingDistributionBar distribution={globalDistribution} />

      {/* ── Search + Filters ── */}
      <div className="space-y-2 mb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par patient, pharmacie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm border-amber-200 focus:border-amber-400"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={`h-10 w-10 shrink-0 ${
              showFilters
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-amber-200'
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground px-1">
                  Statut de réponse
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {REPLY_FILTER_OPTIONS.map((opt) => {
                    const isActive = replyFilter === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setReplyFilter(opt.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                          isActive
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={clearFilters}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Effacer les filtres
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Rating filter tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none">
        {RATING_TABS.map((tab) => {
          const isActive = activeRating === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveRating(tab.key)}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Reviews list ── */}
      {reviews.length === 0 ? (
        <Card className="border-amber-100">
          <CardContent className="p-8 text-center">
            <Inbox className="h-10 w-10 text-amber-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">
              {hasActiveFilters ? 'Aucun avis trouvé' : 'Aucun avis'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'Essayez de modifier vos critères de recherche'
                : 'Les nouveaux avis apparaîtront ici'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeRating}-${currentPage}-${replyFilter}-${searchQuery}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="border-amber-100 overflow-hidden hover:border-amber-300 transition-colors duration-150">
                  <CardContent className="p-4 space-y-2.5">
                    {/* Top row: User + Rating + Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-amber-700">
                            {review.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">
                            {review.user.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">
                              {review.pharmacy.name}
                              {review.pharmacy.city && ` — ${review.pharmacy.city}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <StarRating rating={review.rating} />
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="text-sm text-foreground leading-relaxed">
                      {review.comment}
                    </p>

                    {/* Reply (if any) */}
                    {review.reply && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Reply className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">
                            Réponse de la pharmacie
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {review.reply}
                        </p>
                        {review.replyAt && (
                          <p className="text-[11px] text-muted-foreground">
                            {formatRelativeTime(review.replyAt)}
                            {' · '}
                            {formatDateFull(review.replyAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-amber-100/80 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground pt-2">
                        {formatRelativeTime(review.createdAt)}
                      </span>
                      <div className="flex items-center gap-1 pt-1">
                        {/* Reply status badge */}
                        {review.reply ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0 border-orange-200 bg-orange-50 text-orange-700"
                          >
                            <Reply className="h-2.5 w-2.5 mr-1" />
                            Répondu
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0 border-amber-200 bg-amber-50 text-amber-700"
                          >
                            <MessageSquare className="h-2.5 w-2.5 mr-1" />
                            Sans réponse
                          </Badge>
                        )}

                        {/* View / Reply button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                          onClick={() => openDetail(review)}
                          aria-label="Voir / Répondre"
                        >
                          {review.reply ? (
                            <Pencil className="h-3.5 w-3.5" />
                          ) : (
                            <Reply className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(review)}
                          aria-label="Supprimer l'avis"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Pagination ── */}
      <SmartPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        total={total}
        pageSize={PAGE_SIZE}
        theme="amber"
      />

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        {deleteTarget && (
          <>
            <AlertDialogContent className="sm:max-w-md rounded-2xl border-amber-200">
              <AlertDialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <AlertDialogTitle className="text-base">
                      Supprimer cet avis ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs mt-0.5">
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </div>
                </div>
              </AlertDialogHeader>

              <div className="bg-gray-50 rounded-lg p-3 my-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-amber-700">
                      {deleteTarget.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{deleteTarget.user.name}</span>
                  <StarRating rating={deleteTarget.rating} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {deleteTarget.comment}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {deleteTarget.pharmacy.name} — {deleteTarget.pharmacy.city}
                </p>
              </div>

              <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
                <AlertDialogCancel
                  className="flex-1 sm:flex-none border-amber-200 text-amber-700 hover:bg-amber-50 mt-0"
                  disabled={deleting}
                >
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 sm:flex-none bg-red-600 text-white hover:bg-red-700 border-0 mt-0"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Supprimer
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </>
        )}
      </AlertDialog>

      {/* ── Detail / Reply Dialog ── */}
      <Dialog open={!!detailReview} onOpenChange={(open) => !open && setDetailReview(null)}>
        {detailReview && (
          <DialogContent className="sm:max-w-lg rounded-2xl border-amber-200 max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4.5 w-4.5 text-amber-600" />
                Détail de l&apos;avis
              </DialogTitle>
              <DialogDescription className="text-xs">
                Consultez et répondez à cet avis
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Review author & pharmacy */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-amber-700">
                      {detailReview.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{detailReview.user.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {detailReview.pharmacy.name}
                        {detailReview.pharmacy.city && ` — ${detailReview.pharmacy.city}`}
                      </span>
                    </div>
                  </div>
                </div>
                <StarRating rating={detailReview.rating} size="md" />
              </div>

              {/* Date & rating badge */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {formatDateFull(detailReview.createdAt)}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0 ${
                    detailReview.rating >= 4
                      ? 'border-orange-200 bg-orange-50 text-orange-700'
                      : detailReview.rating === 3
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {detailReview.rating}/5
                </Badge>
              </div>

              {/* Comment */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm leading-relaxed">{detailReview.comment}</p>
              </div>

              {/* Existing reply */}
              {detailReview.reply && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Reply className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">
                      Réponse de la pharmacie
                    </span>
                    {detailReview.replyAt && (
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatRelativeTime(detailReview.replyAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{detailReview.reply}</p>
                </div>
              )}

              {/* Reply input */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {detailReview.reply ? 'Modifier la réponse' : 'Écrire une réponse'}
                </p>
                <Textarea
                  placeholder="Votre réponse..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[80px] text-sm border-amber-200 focus:border-amber-400 resize-none"
                  disabled={replySending}
                />
                <div className="flex justify-end gap-2">
                  {detailReview.reply && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
                      onClick={() => setReplyText(detailReview.reply || '')}
                      disabled={replySending}
                    >
                      Réinitialiser
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                    onClick={handleSendReply}
                    disabled={replySending || !replyText.trim()}
                  >
                    {replySending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Envoi...
                      </>
                    ) : detailReview.reply ? (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Modifier
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Répondre
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
