"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { ToastHost } from "@/components/app/toast-host";
import { BottomNav } from "@/components/app/bottom-nav";
import { AuthScreen } from "@/components/screens/auth-screen";
import { HomeScreen } from "@/components/screens/home-screen";
import { MedicationSearchScreen } from "@/components/screens/medication-search-screen";
import { MedicationDetailScreen } from "@/components/screens/medication-detail-screen";
import { PharmacySearchScreen, GuardPharmaciesScreen } from "@/components/screens/pharmacy-search-screen";
import { PharmacyDetailScreen } from "@/components/screens/pharmacy-detail-screen";
import { OrdersScreen } from "@/components/screens/orders-screen";
import { CartScreen, CheckoutScreen } from "@/components/screens/cart-screen";
import { OrderDetailScreen } from "@/components/screens/order-detail-screen";
import { ProfileScreen } from "@/components/screens/profile-screen";
import { EditProfileScreen, ChangePasswordScreen } from "@/components/screens/edit-profile-screen";
import { Loader2 } from "lucide-react";

// Dynamically import MapScreen (react-leaflet requires window)
const MapScreen = dynamic(
  () => import("@/components/screens/map-screen").then((m) => m.MapScreen),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ),
  }
);

function ScreenRouter() {
  const tab = useAppStore((s) => s.nav.tab);
  const view = useAppStore((s) => s.nav.view);

  // Home tab views
  if (tab === "home") {
    switch (view) {
      case "medication-search":
        return <MedicationSearchScreen />;
      case "medication-detail":
        return <MedicationDetailScreen />;
      case "pharmacy-search":
        return <PharmacySearchScreen />;
      case "guard-pharmacies":
        return <GuardPharmaciesScreen />;
      case "pharmacy-detail":
        return <PharmacyDetailScreen />;
      case "cart":
        return <CartScreen />;
      case "checkout":
        return <CheckoutScreen />;
      default:
        return <HomeScreen />;
    }
  }

  // Map tab
  if (tab === "map") {
    if (view === "pharmacy-detail") return <PharmacyDetailScreen />;
    return <MapScreen />;
  }

  // Orders tab
  if (tab === "orders") {
    if (view === "order-detail") return <OrderDetailScreen />;
    if (view === "cart") return <CartScreen />;
    if (view === "checkout") return <CheckoutScreen />;
    if (view === "pharmacy-detail") return <PharmacyDetailScreen />;
    return <OrdersScreen />;
  }

  // Profile tab
  if (tab === "profile") {
    if (view === "edit-profile") return <EditProfileScreen />;
    if (view === "change-password") return <ChangePasswordScreen />;
    if (view === "pharmacy-detail") return <PharmacyDetailScreen />;
    return <ProfileScreen />;
  }

  return <HomeScreen />;
}

function AppShell() {
  const [booting, setBooting] = useState(true);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const nav = useAppStore((s) => s.nav);

  useEffect(() => {
    void (async () => {
      try {
        const res = await authApi.me();
        if (res.user) {
          setUser({
            ...res.user,
            pharmacyId: res.user.pharmacy?.id || null,
          });
        }
      } catch {
        // not logged in
      } finally {
        setBooting(false);
      }
    })();
  }, [setUser]);

  if (booting) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
              <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4z" />
            </svg>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
        <AuthScreen />
        <ToastHost />
      </div>
    );
  }

  // Logged in: mobile app shell with bottom nav (always visible)
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <main className="flex min-h-0 flex-1 flex-col">
        <ScreenRouter />
      </main>
      <BottomNav />
      <ToastHost />
    </div>
  );
}

export default AppShell;
