"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { ToastHost } from "@/components/app/toast-host";
import { BottomNav } from "@/components/app/bottom-nav";
import { ErrorBoundary } from "@/components/app/error-boundary";
import { AuthScreen } from "@/components/screens/auth-screen";
import { OnboardingScreen } from "@/components/screens/onboarding-screen";
import { HomeScreen } from "@/components/screens/home-screen";
import { MedicationSearchScreen } from "@/components/screens/medication-search-screen";
import { MedicationDetailScreen } from "@/components/screens/medication-detail-screen";
import { PharmacySearchScreen, GuardPharmaciesScreen } from "@/components/screens/pharmacy-search-screen";
import { PharmacyDetailScreen } from "@/components/screens/pharmacy-detail-screen";
import { OrdersScreen } from "@/components/screens/orders-screen";
import { CartScreen, CheckoutScreen } from "@/components/screens/cart-screen";
import { OrderDetailScreen } from "@/components/screens/order-detail-screen";
import { ProfileScreen } from "@/components/screens/profile-screen";
import { HelpScreen } from "@/components/screens/help-screen";
import { EditProfileScreen, ChangePasswordScreen } from "@/components/screens/edit-profile-screen";
import { NotificationsScreen } from "@/components/screens/notifications-screen";
import { NotificationDetailScreen } from "@/components/screens/notification-detail-screen";
import { PageTransition } from "@/components/app/page-transition";
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
  const params = useAppStore((s) => s.nav.params);
  const navKey = `${tab}-${view}-${JSON.stringify(params)}`;

  let screen: ReactNode;

  // Notifications views (accessible from any tab)
  if (view === "notifications") {
    screen = <NotificationsScreen />;
  } else if (view === "notification-detail") {
    screen = <NotificationDetailScreen />;
  } else
  // Home tab views
  if (tab === "home") {
    switch (view) {
      case "medication-search":
        screen = <MedicationSearchScreen />;
        break;
      case "medication-detail":
        screen = <MedicationDetailScreen />;
        break;
      case "pharmacy-search":
        screen = <PharmacySearchScreen />;
        break;
      case "guard-pharmacies":
        screen = <GuardPharmaciesScreen />;
        break;
      case "pharmacy-detail":
        screen = <PharmacyDetailScreen />;
        break;
      case "cart":
        screen = <CartScreen />;
        break;
      case "checkout":
        screen = <CheckoutScreen />;
        break;
      default:
        screen = <HomeScreen />;
    }
  } else if (tab === "cart") {
    if (view === "checkout") screen = <CheckoutScreen />;
    else screen = <CartScreen />;
  } else if (tab === "map") {
    if (view === "pharmacy-detail") screen = <PharmacyDetailScreen />;
    else if (view === "cart") screen = <CartScreen />;
    else if (view === "checkout") screen = <CheckoutScreen />;
    else screen = <MapScreen />;
  } else if (tab === "orders") {
    if (view === "order-detail") screen = <OrderDetailScreen />;
    else if (view === "cart") screen = <CartScreen />;
    else if (view === "checkout") screen = <CheckoutScreen />;
    else if (view === "pharmacy-detail") screen = <PharmacyDetailScreen />;
    else screen = <OrdersScreen />;
  } else if (tab === "profile") {
    if (view === "edit-profile") screen = <EditProfileScreen />;
    else if (view === "change-password") screen = <ChangePasswordScreen />;
    else if (view === "help") screen = <HelpScreen />;
    else if (view === "pharmacy-detail") screen = <PharmacyDetailScreen />;
    else screen = <ProfileScreen />;
  } else {
    screen = <HomeScreen />;
  }

  return <PageTransition navKey={navKey}>{screen}</PageTransition>;
}

function AppShell() {
  const [booting, setBooting] = useState(true);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const nav = useAppStore((s) => s.nav);
  const onboardingDone = useAppStore((s) => s.onboardingDone);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);
  const guestMode = useAppStore((s) => s.guestMode);

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

  if (!onboardingDone) {
    return <OnboardingScreen onDone={setOnboardingDone} />;
  }

  if (!user && !guestMode) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
        <AuthScreen />
        <ToastHost />
      </div>
    );
  }

  // Logged in or guest mode: mobile app shell with bottom nav (always visible)
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <main className="flex min-h-0 flex-1 flex-col">
        <ErrorBoundary>
          <ScreenRouter />
        </ErrorBoundary>
      </main>
      <BottomNav />
      <ToastHost />
    </div>
  );
}

export default AppShell;
