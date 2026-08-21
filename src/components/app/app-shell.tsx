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
import { ScanOrderScreen } from "@/components/screens/scan-order-screen";
import { Loader2, ScanBarcode } from "lucide-react";
import Image from "next/image";
import { notificationMessage, pharmacistNotificationMessage, type Order } from "@/lib/api";

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

// Client-side role guard. Defense in depth: every /api/admin and /api/pharmacist
// route also rejects unauthorized callers, but we don't render the privileged
// UI in the first place if the role doesn't match.
function requireRole(
  user: { role: string } | null,
  roles: string[],
  screen: ReactNode
): ReactNode {
  if (!user || !roles.includes(user.role)) {
    return <AccessDenied />;
  }
  return screen;
}

function AccessDenied() {
  const setTab = useAppStore((s) => s.setTab);
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-4xl font-bold text-muted-foreground/30">403</p>
      <p className="mt-2 text-sm font-medium text-foreground">Accès non autorisé</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Vous n&apos;avez pas les permissions requises pour consulter cette page.
      </p>
      <button
        onClick={() => setTab("home")}
        className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Retour à l&apos;accueil
      </button>
    </div>
  );
}

function ScreenRouter() {
  const tab = useAppStore((s) => s.nav.tab);
  const view = useAppStore((s) => s.nav.view);
  const params = useAppStore((s) => s.nav.params);
  const user = useAppStore((s) => s.user);
  const navKey = `${tab}-${view}-${JSON.stringify(params)}`;

  let screen: ReactNode;

  // Notifications views (accessible from any authenticated tab)
  if (view === "notifications") {
    screen = <NotificationsScreen />;
  } else if (view === "notification-detail") {
    screen = <NotificationDetailScreen />;
  } else if (view === "messages") {
    screen = <MessagesScreen />;
  } else if (view === "chat") {
    screen = <ChatScreen />;
  } else if (view === "scan-order") {
    // Scan-order (look up a customer order by code) is a pharmacist action.
    screen = requireRole(user, ["PHARMACIST"], <ScanOrderScreen />);
  } else if (view === "pharmacist-stock") {
    screen = requireRole(user, ["PHARMACIST"], <PharmacistStockScreen />);
  } else if (view === "pharmacist-pharmacy") {
    screen = requireRole(user, ["PHARMACIST"], <PharmacistPharmacyScreen />);
  } else if (view === "pharmacist-order-detail") {
    screen = requireRole(user, ["PHARMACIST", "ADMIN"], <OrderDetailScreen />);
  } else if (view === "admin-users") {
    screen = requireRole(user, ["ADMIN"], <AdminUsersScreen />);
  } else if (view === "admin-pharmacies") {
    screen = requireRole(user, ["ADMIN"], <AdminPharmaciesScreen />);
  } else if (view === "admin-orders") {
    screen = requireRole(user, ["ADMIN"], <AdminOrdersScreen />);
  } else if (view === "medication-detail") {
    screen = <MedicationDetailScreen />;
  } else if (view === "pharmacy-detail") {
    screen = <PharmacyDetailScreen />;
  } else if (view === "order-detail") {
    // Routed at the top level so the order detail is reachable from any tab
    // (notably the admin tab, where navigate("order-detail") previously left
    // tab="admin" and fell through to the admin dashboard — a dead link).
    screen = <OrderDetailScreen />;
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
    if (!user || user.role !== "PHARMACIST") {
      screen = <AccessDenied />;
    } else if (view === "pharmacist-pharmacy") screen = <PharmacistPharmacyScreen />;
    else screen = <PharmacistDashboardScreen />;
  } else if (tab === "admin") {
    screen = requireRole(user, ["ADMIN"], <AdminDashboardScreen />);
  } else if (tab === "profile") {
    if (view === "edit-profile") screen = <EditProfileScreen />;
    else if (view === "change-password") screen = <ChangePasswordScreen />;
    else if (view === "help") screen = <HelpScreen />;
    else if (view === "pharmacy-detail") screen = <PharmacyDetailScreen />;
    else screen = <ProfileScreen />;
  } else {
    screen = (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-4xl font-bold text-muted-foreground/30">404</p>
        <p className="mt-2 text-sm font-medium text-foreground">Page non trouvée</p>
        <p className="mt-1 text-xs text-muted-foreground">Cette page n&apos;existe pas ou n&apos;est plus disponible.</p>
        <button
          onClick={() => useAppStore.getState().setTab("home")}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  return <PageTransition navKey={navKey}>{screen}</PageTransition>;
}

function AppShell() {
  const [booting, setBooting] = useState(true);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setTab = useAppStore((s) => s.setTab);
  const navigate = useAppStore((s) => s.navigate);
  const view = useAppStore((s) => s.nav.view);
  const onboardingDone = useAppStore((s) => s.onboardingDone);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);
  const guestMode = useAppStore((s) => s.guestMode);
  const setNotificationCount = useAppStore((s) => s.setNotificationCount);

  // SSE connection for real-time notifications (supports all roles)
  useEffect(() => {
    if (!user) return;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function connectSSE() {
      // Close any pre-existing connection and clear a pending reconnect timer
      // so we never end up with overlapping EventSource streams.
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }
      try {
        eventSource = new EventSource("/api/notifications/stream");

        eventSource.addEventListener("notification", (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === "order_update") {
              const changes = data.changes as {
                id: string;
                code: string;
                status: string;
                pharmacyName: string;
                userName: string;
                role: string;
              }[];
              for (const change of changes) {
                const msg =
                  user?.role === "PHARMACIST"
                    ? pharmacistNotificationMessage(
                        change.status as Order["status"],
                        change.userName,
                        change.code,
                        change.pharmacyName
                      )
                    : notificationMessage(change.status as Order["status"], change.pharmacyName, change.code);
                useAppStore.getState().pushToast(msg, "info");
              }
            }
          } catch {
            // ignore
          }
        });

        eventSource.addEventListener("count", (e) => {
          try {
            const data = JSON.parse(e.data);
            setNotificationCount(data.count);
          } catch {
            // ignore
          }
        });

        eventSource.addEventListener("error", () => {
          eventSource?.close();
          reconnectTimer = setTimeout(() => connectSSE(), 5000);
        });
      } catch {
        // SSE not supported, retry later
        reconnectTimer = setTimeout(() => connectSSE(), 10000);
      }
    }

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [user, setNotificationCount]);

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
          <Image src="/logo.svg" alt="Pharma CI" width={56} height={56} className="h-14 w-14 rounded-2xl" priority />
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
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background md:max-w-lg lg:max-w-xl">
        <AuthScreen />
        <ToastHost />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background md:max-w-lg lg:max-w-xl">
      <main className="flex min-h-0 flex-1 flex-col">
        <ErrorBoundary>
          <ScreenRouter />
        </ErrorBoundary>
      </main>

      {/* Floating scan QR button — pharmacist only */}
      {user?.role === "PHARMACIST" && view !== "scan-order" && (
        <button
          onClick={() => navigate("scan-order")}
          className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
          aria-label="Scanner un QR code"
        >
          <ScanBarcode className="h-6 w-6" />
        </button>
      )}

      <BottomNav />
      <ToastHost />
    </div>
  );
}

export default AppShell;
