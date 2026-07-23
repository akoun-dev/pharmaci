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
import { PharmacistDashboardScreen } from "@/components/screens/pharmacist-dashboard-screen";
import { PharmacistStockScreen } from "@/components/screens/pharmacist-stock-screen";
import { PharmacistPharmacyScreen } from "@/components/screens/pharmacist-pharmacy-screen";
import { PharmacistOrdersScreen } from "@/components/screens/pharmacist-orders-screen";
import { AdminDashboardScreen } from "@/components/screens/admin-dashboard-screen";
import { AdminUsersScreen } from "@/components/screens/admin-users-screen";
import { AdminPharmaciesScreen } from "@/components/screens/admin-pharmacies-screen";
import { AdminOrdersScreen } from "@/components/screens/admin-orders-screen";
import { MessagesScreen } from "@/components/screens/messages-screen";
import { ChatScreen } from "@/components/screens/chat-screen";
import { Loader2 } from "lucide-react";

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
  const user = useAppStore((s) => s.user);
  const navKey = `${tab}-${view}-${JSON.stringify(params)}`;

  let screen: ReactNode;

  // Notifications views (accessible from any tab)
  if (view === "notifications") {
    screen = <NotificationsScreen />;
  } else if (view === "notification-detail") {
    screen = <NotificationDetailScreen />;
  } else if (view === "messages") {
    screen = <MessagesScreen />;
  } else if (view === "chat") {
    screen = <ChatScreen />;
  } else if (view === "pharmacist-stock") {
    screen = <PharmacistStockScreen />;
  } else if (view === "pharmacist-pharmacy") {
    screen = <PharmacistPharmacyScreen />;
  } else if (view === "pharmacist-order-detail") {
    screen = <OrderDetailScreen />;
  } else if (view === "admin-users") {
    screen = <AdminUsersScreen />;
  } else if (view === "admin-pharmacies") {
    screen = <AdminPharmaciesScreen />;
  } else if (view === "admin-orders") {
    screen = <AdminOrdersScreen />;
  } else if (view === "medication-detail") {
    screen = <MedicationDetailScreen />;
  } else if (view === "pharmacy-detail") {
    screen = <PharmacyDetailScreen />;
  } else if (tab === "home") {
    switch (view) {
      case "medication-search":
        screen = <MedicationSearchScreen />;
        break;
      case "pharmacy-search":
        screen = <PharmacySearchScreen />;
        break;
      case "guard-pharmacies":
        screen = <GuardPharmaciesScreen />;
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
    if (view === "cart") screen = <CartScreen />;
    else if (view === "checkout") screen = <CheckoutScreen />;
    else screen = <MapScreen />;
  } else if (tab === "orders") {
    if (view === "order-detail" || view === "pharmacist-order-detail") screen = <OrderDetailScreen />;
    else if (view === "cart") screen = <CartScreen />;
    else if (view === "checkout") screen = <CheckoutScreen />;
    else if (user?.role === "PHARMACIST") screen = <PharmacistOrdersScreen />;
    else screen = <OrdersScreen />;
  } else if (tab === "pharmacist") {
    if (view === "pharmacist-pharmacy") screen = <PharmacistPharmacyScreen />;
    else screen = <PharmacistDashboardScreen />;
  } else if (tab === "admin") {
    screen = <AdminDashboardScreen />;
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
  const setTab = useAppStore((s) => s.setTab);
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
          if (res.user.role === "PHARMACIST") {
            setTab("pharmacist");
          } else if (res.user.role === "ADMIN") {
            setTab("admin");
          }
        }
      } catch {
        // not logged in
      } finally {
        setBooting(false);
      }
    })();
  }, [setUser, setTab]);

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
