"use client";

import { ArrowLeft, Bell, ShoppingCart, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAppStore } from "@/lib/store";
import { Logo } from "@/components/app/logo";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showCart?: boolean;
  onNotificationClick?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
  subtitle?: string;
}

export function AppHeader({
  title,
  showBack = false,
  showLogo = false,
  showCart = false,
  onNotificationClick,
  rightSlot,
  className,
  subtitle,
}: AppHeaderProps) {
  const goBack = useAppStore((s) => s.goBack);
  const canGoBack = useAppStore((s) => s.nav.history.length > 0);
  const pushToast = useAppStore((s) => s.pushToast);
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const cartCount = useAppStore((s) => s.cartCount());
  const notificationCount = useAppStore((s) => s.notificationCount);
  const { theme, setTheme } = useTheme();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        className
      )}
    >
      {showBack && canGoBack && (
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      {showLogo && <Logo size="sm" showText={false} />}
      {title && (
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-[11px] text-muted-foreground -mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      <div className="flex-1" />
      {rightSlot}
      {showCart && user && (
        <button
          onClick={() => navigate("cart")}
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
          aria-label="Panier"
        >
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <span
              key={cartCount}
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-cart-pop"
            >
              {cartCount}
            </span>
          )}
        </button>
      )}
      {user && (
        <button
          onClick={onNotificationClick || (() => {
            navigate("notifications");
          })}
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm animate-cart-pop">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>
      )}
    </header>
  );
}
