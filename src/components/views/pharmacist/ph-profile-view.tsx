'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2,
  Star,
  MessageSquare,
  ShoppingCart,
  MapPin,
  Phone,
  Mail,
  Clock,
  ParkingCircle,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Save,
  CheckCircle2,
  Circle,
  XCircle,
  Reply,
  Send,
  Locate,
  Navigation,
  Camera,
  Upload,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ViewHeader } from '@/components/view-header';
import { RatingStars } from '@/components/rating-stars';
import { useAppStore } from '@/store/app-store';
import { useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  description: string;
  parkingInfo: string;
  isGuard: boolean;
  isOpen24h: boolean;
  rating: number;
  reviewCount: number;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reply: string | null;
  replyAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

// ── Constants ────────────────────────────────────────────────────────

function safeParseJSON(str: string | null | undefined): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ── Skeletons ────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      {/* Info card */}
      <Card className="border-orange-100">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-24" />
          <div className="flex flex-wrap gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-orange-100">
            <CardContent className="p-3 text-center">
              <Skeleton className="h-7 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Reviews */}
      <Card className="border-orange-100">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2 pb-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export function PharmacistProfileView() {
  const { currentUser } = useAppStore();

  // Loading / error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile form
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('20:00');
  const [description, setDescription] = useState('');
  const [parkingInfo, setParkingInfo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [isGuard, setIsGuard] = useState(false);
  const [isOpen24h, setIsOpen24h] = useState(false);

  // Stats
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  // Photo upload
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState<string | null>(null);

  // ── Load profile ─────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pharmacist/profile');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de chargement');
      }
      const data: ProfileData = await res.json();

      setName(data.name || '');
      setAddress(data.address || '');
      setCity(data.city || '');
      setDistrict(data.district || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setOpenTime(data.openTime || '08:00');
      setCloseTime(data.closeTime || '20:00');
      setDescription(data.description || '');
      setParkingInfo(data.parkingInfo || '');
      setLatitude(data.latitude != null ? String(data.latitude) : '');
      setLongitude(data.longitude != null ? String(data.longitude) : '');
      setIsGuard(data.isGuard ?? false);
      setIsOpen24h(data.isOpen24h ?? false);
      setRating(data.rating || 0);
      setReviewCount(data.reviewCount || 0);
      setPhotoPreview(data.imageUrl || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Photo upload handler ─────────────────────────────────────

  const handlePhotoUpload = async (file: File) => {
    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.');
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux. Taille maximale : 5 Mo.');
      return;
    }

    setUploading(true);
    try {
      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/pharmacist/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'envoi de la photo");
      }

      const { url } = await res.json();

      // Save imageUrl to pharmacy profile
      const saveRes = await fetch('/api/pharmacist/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (!saveRes.ok) {
        const data = await saveRes.json();
        throw new Error(data.error || 'Erreur de sauvegarde');
      }

      // Use the server URL (not data URL) for final preview
      setPhotoPreview(url);
      toast.success('Photo mise à jour avec succès');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi de la photo");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoUpload(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // ── Load reviews ─────────────────────────────────────────────────

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch('/api/pharmacist/reviews');
      if (!res.ok) return;
      const data = await res.json();
      setReviews((data.reviews || []).slice(0, 10) as Review[]);
    } catch {
      // Silently ignore review errors
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchReviews();
  }, [fetchProfile, fetchReviews]);

  // ── Load orders count for stats ──────────────────────────────────

  useEffect(() => {
    async function fetchOrderCount() {
      try {
        const res = await fetch('/api/pharmacist/orders?limit=1');
        if (!res.ok) return;
        const data = await res.json();
        setTotalOrders(data.total || data.orders?.length || 0);
      } catch {
        // ignore
      }
    }
    fetchOrderCount();
  }, []);

  // ── Geolocation ────────────────────────────────────────────

  const handleUseMyPosition = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée par votre navigateur');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        toast.success('Position détectée avec succès');
        setGeoLoading(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Permission de localisation refusée');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Position indisponible');
            break;
          case error.TIMEOUT:
            toast.error('Délai de localisation dépassé');
            break;
          default:
            toast.error('Erreur de localisation');
        }
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Save ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Le nom de la pharmacie est requis');
      return;
    }

    // Validate coordinates if provided
    if (latitude) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        toast.error('La latitude doit être entre -90 et 90');
        return;
      }
    }
    if (longitude) {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        toast.error('La longitude doit être entre -180 et 180');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/pharmacist/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          district: district.trim(),
          phone: phone.trim(),
          email: email.trim(),
          openTime,
          closeTime,
          description: description.trim(),
          parkingInfo: parkingInfo.trim(),
          isGuard,
          isOpen24h,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de sauvegarde');
      }

      toast.success('Profil mis à jour avec succès');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Send reply ──────────────────────────────────────────────

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error('La réponse ne peut pas être vide');
      return;
    }

    try {
      setReplySending(reviewId);
      const res = await fetch(`/api/pharmacist/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, reply: replyText.trim(), replyAt: new Date().toISOString() }
            : r
        )
      );
      setReplyingTo(null);
      setReplyText('');
      toast.success('Réponse envoyée');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setReplySending(null);
    }
  };

  // ── Satisfaction distribution ──────────────────────────────

  const getRatingDistribution = () => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating]++;
    });
    const maxCount = Math.max(...Object.values(dist), 1);
    return { dist, maxCount };
  };

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-6">
      <ViewHeader
        title="Profil de la pharmacie"
        back={true}
        icon={<Building2 className="h-5 w-5 text-orange-600" />}
      />

      {/* Error state */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProfile}
                className="flex-shrink-0 border-red-200 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading */}
      {loading && <ProfileSkeleton />}

      {/* Content */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* ── Pharmacy Info Card ──────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-orange-100">
              <CardHeader className="pb-3 px-4 sm:px-5 pt-4 sm:pt-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-600" />
                  Informations de la pharmacie
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
                {/* Photo upload section */}
                <div
                  className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                    isDragOver
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {uploading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80">
                      <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                    </div>
                  )}
                  {photoPreview ? (
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-200 shadow-md">
                        <img
                          src={photoPreview}
                          alt="Photo de la pharmacie"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {!uploading && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoPreview(null);
                          }}
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-orange-400" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isDragOver ? 'Déposez le fichier ici' : 'Cliquez ou glissez une image (JPEG, PNG, max 5 Mo)'}
                    </p>
                  </div>
                </div>

                <Separator className="bg-orange-100/60" />

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="ph-name" className="text-xs font-medium text-muted-foreground">
                    Nom
                  </Label>
                  <Input
                    id="ph-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom de la pharmacie"
                    className="h-10 text-sm"
                  />
                </div>

                {/* Address row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ph-address" className="text-xs font-medium text-muted-foreground">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      Adresse
                    </Label>
                    <Input
                      id="ph-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Adresse"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ph-city" className="text-xs font-medium text-muted-foreground">
                      Ville
                    </Label>
                    <Input
                      id="ph-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ville"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                {/* District + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ph-district" className="text-xs font-medium text-muted-foreground">
                      Quartier
                    </Label>
                    <Input
                      id="ph-district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Quartier"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ph-phone" className="text-xs font-medium text-muted-foreground">
                      <Phone className="h-3 w-3 inline mr-1" />
                      Téléphone
                    </Label>
                    <Input
                      id="ph-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225 XX XX XX XX"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="ph-email" className="text-xs font-medium text-muted-foreground">
                    <Mail className="h-3 w-3 inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="ph-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@pharmacie.ci"
                    className="h-10 text-sm"
                  />
                </div>

                <Separator className="bg-orange-100/60" />

                {/* Hours */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ph-open" className="text-xs font-medium text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Heure d&apos;ouverture
                    </Label>
                    <Input
                      id="ph-open"
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ph-close" className="text-xs font-medium text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Heure de fermeture
                    </Label>
                    <Input
                      id="ph-close"
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="ph-desc" className="text-xs font-medium text-muted-foreground">
                    Description
                  </Label>
                  <Textarea
                    id="ph-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre pharmacie..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>

                <Separator className="bg-orange-100/60" />

                {/* Parking Info */}
                <div className="space-y-1.5">
                  <Label htmlFor="ph-parking" className="text-xs font-medium text-muted-foreground">
                    <ParkingCircle className="h-3 w-3 inline mr-1" />
                    Infos parking
                  </Label>
                  <Input
                    id="ph-parking"
                    value={parkingInfo}
                    onChange={(e) => setParkingInfo(e.target.value)}
                    placeholder="Ex: Parking gratuit, 10 places..."
                    className="h-10 text-sm"
                  />
                </div>

                <Separator className="bg-orange-100/60" />

                {/* GPS Coordinates */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Coordonnées GPS</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 px-2.5 border-orange-200 text-orange-700 hover:bg-orange-50"
                      onClick={handleUseMyPosition}
                      disabled={geoLoading}
                    >
                      {geoLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Locate className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Utiliser ma position
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ph-lat" className="text-[11px] font-medium text-muted-foreground">
                        <Navigation className="h-3 w-3 inline mr-0.5" />
                        Latitude (-90 à 90)
                      </Label>
                      <Input
                        id="ph-lat"
                        type="number"
                        step="0.000001"
                        min="-90"
                        max="90"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="5.3600"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ph-lng" className="text-[11px] font-medium text-muted-foreground">
                        <Navigation className="h-3 w-3 inline mr-0.5" />
                        Longitude (-180 à 180)
                      </Label>
                      <Input
                        id="ph-lng"
                        type="number"
                        step="0.000001"
                        min="-180"
                        max="180"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="-4.0083"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-orange-100/60" />

                {/* Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pharmacie de garde</p>
                        <p className="text-[11px] text-muted-foreground">
                          Visible dans la liste des gardes
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isGuard}
                      onCheckedChange={setIsGuard}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ouvert 24h/24</p>
                        <p className="text-[11px] text-muted-foreground">
                          Disponible jour et nuit
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isOpen24h}
                      onCheckedChange={setIsOpen24h}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Stats Section ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3"
          >
            <Card className="border-orange-100">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-lg font-bold text-foreground">
                    {rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">Note moyenne</p>
              </CardContent>
            </Card>
            <Card className="border-orange-100">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  <span className="text-lg font-bold text-foreground">
                    {reviewCount}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">Nombre d&apos;avis</p>
              </CardContent>
            </Card>
            <Card className="border-orange-100">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                  <span className="text-lg font-bold text-foreground">
                    {totalOrders}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">Total commandes</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Recent Reviews ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-orange-100">
              <CardHeader className="pb-3 px-4 sm:px-5 pt-4 sm:pt-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  Avis récents
                  {reviews.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700">
                      {reviews.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                {/* Satisfaction chart */}
                {!reviewsLoading && reviews.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    {(() => {
                      const { dist, maxCount } = getRatingDistribution();
                      return (
                        <div className="space-y-1.5">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = dist[star];
                            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            const barColor =
                              star >= 4
                                ? 'bg-orange-500'
                                : star === 3
                                  ? 'bg-amber-500'
                                  : 'bg-red-500';
                            return (
                              <div key={star} className="flex items-center gap-2">
                                <span className="text-xs font-medium w-3 text-right">{star}</span>
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${barColor} transition-all`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {reviewsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2 pb-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun avis pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="py-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                              {(review.user?.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                              {review.user?.name || 'Anonyme'}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">
                            {formatRelativeTime(review.createdAt)}
                          </span>
                        </div>
                        <RatingStars rating={review.rating} size={13} className="mb-1.5" />
                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {review.comment}
                          </p>
                        )}

                        {/* Existing reply */}
                        {review.reply && (
                          <div className="mt-2 p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Building2 className="h-3 w-3 text-orange-600" />
                              <span className="text-[11px] font-semibold text-orange-700">Réponse de la pharmacie</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{review.reply}</p>
                          </div>
                        )}

                        {/* Reply button / form */}
                        {!review.reply && (
                          <div className="mt-2">
                            {replyingTo === review.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Votre réponse..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  rows={2}
                                  className="text-sm resize-none border-orange-200 focus:border-orange-400"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-8 px-2"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText('');
                                    }}
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="text-xs h-8 px-3 bg-orange-600 hover:bg-orange-700 text-white"
                                    onClick={() => handleSendReply(review.id)}
                                    disabled={replySending === review.id || !replyText.trim()}
                                  >
                                    {replySending === review.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Send className="h-3.5 w-3.5 mr-1" />
                                    )}
                                    Envoyer
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2 text-orange-600 hover:bg-orange-50"
                                onClick={() => {
                                  setReplyingTo(review.id);
                                  setReplyText('');
                                }}
                              >
                                <Reply className="h-3.5 w-3.5 mr-1" />
                                Répondre
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Save Button ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
