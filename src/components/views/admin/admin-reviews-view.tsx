'use client';

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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight as ChevronRightIcon,
  X,
  Loader2,
  Building2,
  Reply,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ViewHeader } from '@/components/view-header';
import { toast } from 'sonner';

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

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `il y a ${diffMin}min`;
    if (diffH < 24) return `il y a ${diffH}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function formatDateFull(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

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

function RatingDistributionBar({ distribution, total }: { distribution: RatingDistribution; total: number }) {
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
    <Card className="border-violet-100 mb-4">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-700">{avg}</p>
            <StarRating rating={Math.round(Number(avg))} size="md" />
            <p className="text-[11px] text-muted-foreground mt-0.5">{total} avis</p>
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
                          ? 'bg-emerald-400'
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

  // Rating distribution
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution>({});

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ReviewData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──
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
        params.set('replyStatus', replyFilter);
      }
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }

      const res = await fetch(`/api/admin/reviews?${params}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();

      setReviews(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      setRatingDistribution(data.ratingDistribution || {});
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
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveRating(0);
    setReplyFilter('all');
  };

  const hasActiveFilters = activeRating > 0 || replyFilter !== 'all' || searchQuery.trim().length > 0;

  // ── Pagination helpers ──
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

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

      // Update rating distribution
      const starKey = String(deleteTarget.rating);
      setRatingDistribution((prev) => ({
        ...prev,
        [starKey]: Math.max(0, (prev[starKey] || 1) - 1),
      }));

      toast.success('Avis supprimé avec succès');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 space-y-4">
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        <ViewHeader
          title="Gestion des avis"
          icon={<Star className="h-5 w-5 text-violet-600" />}
        />
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 pb-28">
      {/* ── Header ── */}
      <ViewHeader
        title="Gestion des avis"
        icon={<Star className="h-5 w-5 text-violet-600" />}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
              {total}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-violet-600"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {/* ── Rating Distribution Summary ── */}
      <RatingDistributionBar distribution={ratingDistribution} total={total} />

      {/* ── Search + Filters ── */}
      <div className="space-y-2 mb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par patient, pharmacie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm border-violet-200 focus:border-violet-400"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={`h-10 w-10 shrink-0 ${
              showFilters
                ? 'border-violet-300 bg-violet-50 text-violet-700'
                : 'border-violet-200'
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
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
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
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Reviews list ── */}
      {reviews.length === 0 ? (
        <Card className="border-violet-100">
          <CardContent className="p-8 text-center">
            <Inbox className="h-10 w-10 text-violet-300 mx-auto mb-3" />
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
                <Card className="border-violet-100 overflow-hidden hover:border-violet-300 transition-colors duration-150">
                  <CardContent className="p-4 space-y-2.5">
                    {/* Top row: User + Rating + Delete */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-violet-700">
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StarRating rating={review.rating} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(review)}
                          aria-label="Supprimer l'avis"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="text-sm text-foreground leading-relaxed">
                      {review.comment}
                    </p>

                    {/* Reply (if any) */}
                    {review.reply && (
                      <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Reply className="h-3.5 w-3.5 text-violet-600" />
                          <span className="text-xs font-semibold text-violet-700">
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

                    {/* No reply badge */}
                    {!review.reply && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 border-amber-200 bg-amber-50 text-amber-700"
                      >
                        <MessageSquare className="h-2.5 w-2.5 mr-1" />
                        Sans réponse
                      </Badge>
                    )}

                    {/* Footer */}
                    <div className="border-t border-violet-100/80 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground pt-2">
                        {formatRelativeTime(review.createdAt)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 ${
                          review.rating >= 4
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : review.rating === 3
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                      >
                        {review.rating}/5
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
            disabled={!hasPrev}
            onClick={() => goToPage(1)}
            aria-label="Première page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
            disabled={!hasPrev}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {(() => {
              const pages: (number | string)[] = [];
              const start = Math.max(1, currentPage - 2);
              const end = Math.min(totalPages, currentPage + 2);

              if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
              }
              for (let i = start; i <= end; i++) {
                pages.push(i);
              }
              if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
              }
              return pages.map((page, idx) =>
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
                    className={`h-9 w-9 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'hover:bg-violet-50 text-violet-700'
                    }`}
                  >
                    {page}
                  </button>
                )
              );
            })()}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
            disabled={!hasNext}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Page suivante"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
            disabled={!hasNext}
            onClick={() => goToPage(totalPages)}
            aria-label="Dernière page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Page info ── */}
      {total > 0 && (
        <p className="text-center text-[11px] text-muted-foreground mt-2">
          {(currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, total)} sur {total} avis
        </p>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        {deleteTarget && (
          <>
            <AlertDialogContent className="sm:max-w-md rounded-2xl border-violet-200">
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
                  <div className="w-6 h-6 rounded-full bg-violet-50 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-violet-700">
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
                  className="flex-1 sm:flex-none border-violet-200 text-violet-700 hover:bg-violet-50 mt-0"
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
    </div>
  );
}
