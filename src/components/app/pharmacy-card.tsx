"use client";

import { Star, MapPin, Clock, Phone, Navigation, ShieldCheck, Truck, CreditCard, Syringe, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { Pharmacy } from "@/lib/api";
import { formatDistance, haversineDistance } from "@/lib/api";

export function StarRating({
  rating,
  size = "sm",
  showNumber = false,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}) {
  const sizeClass = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" }[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fillPct = Math.max(0, Math.min(1, rating - (i - 1))) * 100;
        return (
          <div key={i} className="relative">
            <Star className={cn(sizeClass, "text-amber-300")} fill="currentColor" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPct}%` }}
            >
              <Star className={cn(sizeClass, "text-amber-500")} fill="currentColor" />
            </div>
          </div>
        );
      })}
      {showNumber && (
        <span className="ml-1 text-xs font-semibold text-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Service / payment icon mapper
const serviceIcons: Record<string, { icon: typeof ShieldCheck; label: string }> = {
  vaccination: { icon: Syringe, label: "Vaccination" },
  conseil: { icon: ShieldCheck, label: "Conseil" },
  livraison: { icon: Truck, label: "Livraison" },
  tiers_payant: { icon: CreditCard, label: "Tiers-Payant" },
};

export function ServiceBadges({
  services,
  compact = false,
}: {
  services: string;
  compact?: boolean;
}) {
  const list = services
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.slice(0, compact ? 2 : 4).map((s) => {
        const meta = serviceIcons[s];
        if (!meta) return null;
        const Icon = meta.icon;
        return (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

export function StatusBadge({
  isOnGuard,
  isOpen24h,
  hideGuard = false,
}: {
  isOnGuard: boolean;
  isOpen24h: boolean;
  hideGuard?: boolean;
}) {
  const user = useAppStore((s) => s.user);
  const showGuard = isOnGuard && !hideGuard && !!user;
  if (showGuard) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-bold text-orange-500">
        DE GARDE
      </span>
    );
  }
  if (isOpen24h) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-bold text-green-500">
        <Clock className="h-3 w-3" /> 24/7
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-bold text-green-500">
      OUVERT
    </span>
  );
}

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  userLat?: number;
  userLng?: number;
  onClick?: () => void;
  compact?: boolean;
  hideGuard?: boolean;
}

export function PharmacyCard({
  pharmacy,
  userLat,
  userLng,
  onClick,
  compact = false,
  hideGuard = false,
}: PharmacyCardProps) {
  const distance =
    userLat != null && userLng != null
      ? haversineDistance(userLat, userLng, pharmacy.latitude, pharmacy.longitude)
      : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md",
        compact ? "p-3" : "p-0"
      )}
    >
      {!compact && pharmacy.imageUrl && (
        <div className="relative h-32 w-full overflow-hidden">
          <img
            src={pharmacy.imageUrl}
            alt={pharmacy.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute left-3 top-3">
            <StatusBadge isOnGuard={pharmacy.isOnGuard} isOpen24h={pharmacy.isOpen24h} hideGuard={hideGuard} />
          </div>
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-white drop-shadow">
              {pharmacy.name}
            </h3>
          </div>
        </div>
      )}
      <div className={cn("space-y-2", compact ? "" : "p-3")}>
        {compact && (
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground">{pharmacy.name}</h3>
            <StatusBadge isOnGuard={pharmacy.isOnGuard} isOpen24h={pharmacy.isOpen24h} hideGuard={hideGuard} />
          </div>
        )}
        <div className="flex items-center gap-2">
          <StarRating rating={pharmacy.rating} showNumber />
          <span className="text-xs text-muted-foreground">
            ({pharmacy.reviewCount} avis)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          <span className="truncate">
            {pharmacy.address}
            {distance != null && (
              <span className="ml-1 font-medium text-foreground">
                • {formatDistance(distance)}
              </span>
            )}
          </span>
        </div>
        {!compact && <ServiceBadges services={pharmacy.services} compact />}
        {!compact && onClick && (
          <div className="flex gap-2 pt-1">
            <a
              href={`tel:${pharmacy.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-500/10 py-2 text-xs font-semibold text-blue-500 transition-colors hover:bg-blue-500/20"
            >
              <Phone className="h-3.5 w-3.5" />
              Appeler
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Navigation className="h-3.5 w-3.5" />
              Détails
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact pharmacy card for horizontal carousels
export function PharmacyCardCompact({
  pharmacy,
  userLat,
  userLng,
  isFavorite,
  onClick,
  hideGuard = false,
}: {
  pharmacy: Pharmacy;
  userLat?: number;
  userLng?: number;
  isFavorite?: boolean;
  onClick?: () => void;
  hideGuard?: boolean;
}) {
  const distance =
    userLat != null && userLng != null
      ? haversineDistance(userLat, userLng, pharmacy.latitude, pharmacy.longitude)
      : null;

  return (
    <div
      onClick={onClick}
      className="flex w-64 shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
    >
      {pharmacy.imageUrl ? (
        <div className="relative h-24 w-full overflow-hidden">
          <img
            src={pharmacy.imageUrl}
            alt={pharmacy.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute left-2 top-2">
            <StatusBadge isOnGuard={pharmacy.isOnGuard} isOpen24h={pharmacy.isOpen24h} hideGuard={hideGuard} />
          </div>
          {isFavorite && (
            <div className="absolute right-2 top-2">
              <Heart className="h-4 w-4 text-red-500 drop-shadow" fill="currentColor" />
            </div>
          )}
          <h3 className="absolute bottom-1.5 left-2 right-2 truncate text-sm font-bold text-white drop-shadow">
            {pharmacy.name}
          </h3>
        </div>
      ) : (
        <div className="relative flex h-20 items-center justify-center bg-primary/10">
          <span className="text-2xl font-bold text-primary">
            {pharmacy.name.charAt(0)}
          </span>
          <div className="absolute left-2 top-2">
            <StatusBadge isOnGuard={pharmacy.isOnGuard} isOpen24h={pharmacy.isOpen24h} hideGuard={hideGuard} />
          </div>
          {isFavorite && (
            <div className="absolute right-2 top-2">
              <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
            </div>
          )}
        </div>
      )}
      <div className="space-y-1.5 p-2.5">
        {!pharmacy.imageUrl && (
          <h3 className="truncate text-sm font-bold text-foreground">{pharmacy.name}</h3>
        )}
        <div className="flex items-center gap-1.5">
          <StarRating rating={pharmacy.rating} showNumber />
          <span className="text-[11px] text-muted-foreground">
            ({pharmacy.reviewCount})
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-primary/70" />
          <span className="truncate">
            {pharmacy.district || pharmacy.city}
            {distance != null && (
              <span className="ml-1 font-medium text-foreground">
                • {formatDistance(distance)}
              </span>
            )}
          </span>
        </div>
        <ServiceBadges services={pharmacy.services} compact />
        <a
          href={`tel:${pharmacy.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 flex items-center justify-center gap-1 rounded-lg bg-blue-500/10 py-1.5 text-xs font-semibold text-blue-500 transition-colors hover:bg-blue-500/20"
        >
          <Phone className="h-3 w-3" />
          Appeler
        </a>
      </div>
    </div>
  );
}
