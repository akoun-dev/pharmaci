'use client';

import { logger } from '@/lib/logger';
import { fetcher } from '@/lib/fetcher';
import { useEffect, useSyncExternalStore, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  Heart,
  User,
  Pill,
  ClipboardList,
  Package,
  MessageCircle,
  Bell,
  Settings,
  Tag,
  LayoutDashboard,
  Users,
  Building2,
  Star,
  FlaskConical,
  BarChart3,
  Shield,
  ShoppingCart,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useAppStore, View } from '@/store/app-store';
import { AuthScreen } from '@/components/auth/auth-screen';
import { HomeView } from '@/components/views/home-view';
import { SearchView } from '@/components/views/search-view';
import { MapView } from '@/components/views/map-view';
import { PharmacyDetailView } from '@/components/views/pharmacy-detail-view';
import { MedicationDetailView } from '@/components/views/medication-detail-view';
import { ProfileView } from '@/components/views/profile-view';
import { FavoritesView } from '@/components/views/favorites-view';
import { PharmacyDashboardView } from '@/components/views/pharmacy-dashboard-view';
import { CartView } from '@/components/views/cart-view';
import { CartCheckoutView } from '@/components/views/cart-checkout-view';
import { OrderConfirmationView } from '@/components/views/order-confirmation-view';
import { OrderHistoryView } from '@/components/views/order-history-view';
import { MyReviewsView } from '@/components/views/my-reviews-view';
import { PharmacistDashboardView } from '@/components/views/pharmacist/ph-dashboard-view';
import { PharmacistStockListView } from '@/components/views/pharmacist/ph-stock-list-view';
import { PharmacistStockDetailView } from '@/components/views/pharmacist/ph-stock-detail-view';
import { PharmacistStockAddView } from '@/components/views/pharmacist/ph-stock-add-view';
import { PharmacistOrdersView } from '@/components/views/pharmacist/ph-orders-view';
import { PharmacistOrderDetailView } from '@/components/views/pharmacist/ph-order-detail-view';
import { PharmacistProfileView } from '@/components/views/pharmacist/ph-profile-view';
import { PharmacistNotificationsView } from '@/components/views/pharmacist/ph-notifications-view';
import { PharmacistMessagesView } from '@/components/views/pharmacist/ph-messages-view';
import { PharmacistPromotionsView } from '@/components/views/pharmacist/ph-promotions-view';
import { PharmacistSettingsView } from '@/components/views/pharmacist/ph-settings-view';
import { PharmacistReportsView } from '@/components/views/pharmacist/ph-reports-view';
import { PharmacistFaqView } from '@/components/views/pharmacist/ph-faq-view';
import { AdminDashboardView } from '@/components/views/admin/admin-dashboard-view';
import { AdminUsersView } from '@/components/views/admin/admin-users-view';
import { AdminPharmaciesView } from '@/components/views/admin/admin-pharmacies-view';
import { AdminOrdersView } from '@/components/views/admin/admin-orders-view';
import { AdminMedicationsView } from '@/components/views/admin/admin-medications-view';
import { AdminReviewsView } from '@/components/views/admin/admin-reviews-view';
import { AdminAnalyticsView } from '@/components/views/admin/admin-analytics-view';
import { AdminSettingsView } from '@/components/views/admin/admin-settings-view';

type PatientTabKey = 'home' | 'search' | 'favorites' | 'order-history' | 'profile';
type PharmacistTabKey = 'ph-dashboard' | 'ph-stock-list' | 'ph-orders' | 'ph-notifications' | 'ph-profile';
type AdminTabKey = 'admin-dashboard' | 'admin-users' | 'admin-pharmacies' | 'admin-orders' | 'admin-medications' | 'admin-reviews' | 'admin-analytics';

const patientTabs: { key: PatientTabKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Accueil', icon: Home },
  { key: 'search', label: 'Recherche', icon: Search },
  { key: 'favorites', label: 'Favoris', icon: Heart },
  { key: 'order-history', label: 'Commandes', icon: ClipboardList },
  { key: 'profile', label: 'Profil', icon: User },
];

const pharmacistTabs: { key: PharmacistTabKey; label: string; icon: typeof Home }[] = [
  { key: 'ph-dashboard', label: 'Accueil', icon: Home },
  { key: 'ph-stock-list', label: 'Stocks', icon: Package },
  { key: 'ph-orders', label: 'Commandes', icon: ClipboardList },
  { key: 'ph-notifications', label: 'Alertes', icon: Bell },
  { key: 'ph-profile', label: 'Profil', icon: User },
];

const adminTabs: { key: AdminTabKey; label: string; icon: typeof Home }[] = [
  { key: 'admin-dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'admin-users', label: 'Utilisateurs', icon: Users },
  { key: 'admin-pharmacies', label: 'Pharmacies', icon: Building2 },
  { key: 'admin-orders', label: 'Commandes', icon: ClipboardList },
  { key: 'admin-medications', label: 'Médicaments', icon: FlaskConical },
  { key: 'admin-reviews', label: 'Avis', icon: Star },
  { key: 'admin-analytics', label: 'Analyses', icon: BarChart3 },
];

const patientViewToTab: Partial<Record<View, PatientTabKey>> = {
  home: 'home',
  search: 'search',
  map: 'home',
  favorites: 'favorites',
  profile: 'profile',
  'pharmacy-detail': 'home',
  'medication-detail': 'search',
  'pharmacy-dashboard': 'profile',
  'order-confirmation': 'order-history',
  'order-history': 'order-history',
  cart: 'search',
  'cart-checkout': 'search',
};

const pharmacistViewToTab: Partial<Record<View, PharmacistTabKey>> = {
  'ph-dashboard': 'ph-dashboard',
  'ph-stock-list': 'ph-stock-list',
  'ph-stock-detail': 'ph-stock-list',
  'ph-stock-add': 'ph-stock-list',
  'ph-orders': 'ph-orders',
  'ph-order-detail': 'ph-orders',
  'ph-profile': 'ph-profile',
  'ph-notifications': 'ph-notifications',
  'ph-messages': 'ph-notifications',
  'ph-promotions': 'ph-profile',
  'ph-settings': 'ph-profile',
  'ph-reports': 'ph-dashboard',
  'ph-faq': 'ph-profile',
};

const adminViewToTab: Partial<Record<View, AdminTabKey>> = {
  'admin-dashboard': 'admin-dashboard',
  'admin-users': 'admin-users',
  'admin-pharmacies': 'admin-pharmacies',
  'admin-orders': 'admin-orders',
  'admin-medications': 'admin-medications',
  'admin-reviews': 'admin-reviews',
  'admin-analytics': 'admin-analytics',
  'admin-settings': 'admin-dashboard',
};

function PatientViewRenderer() {
  const { currentView } = useAppStore();

  const views: Record<string, React.ReactNode> = {
    home: <HomeView />,
    search: <SearchView />,
    map: <MapView />,
    'pharmacy-detail': <PharmacyDetailView />,
    'medication-detail': <MedicationDetailView />,
    profile: <ProfileView />,
    favorites: <FavoritesView />,
    'pharmacy-dashboard': <PharmacyDashboardView />,
    'order-confirmation': <OrderConfirmationView />,
    'order-history': <OrderHistoryView />,
    'my-reviews': <MyReviewsView />,
    cart: <CartView />,
    'cart-checkout': <CartCheckoutView />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
      >
        {views[currentView]}
      </motion.div>
    </AnimatePresence>
  );
}

function PharmacistViewRenderer() {
  const { currentView } = useAppStore();

  const views: Record<string, React.ReactNode> = {
    'ph-dashboard': <PharmacistDashboardView />,
    'ph-stock-list': <PharmacistStockListView />,
    'ph-stock-detail': <PharmacistStockDetailView />,
    'ph-stock-add': <PharmacistStockAddView />,
    'ph-orders': <PharmacistOrdersView />,
    'ph-order-detail': <PharmacistOrderDetailView />,
    'ph-profile': <PharmacistProfileView />,
    'ph-notifications': <PharmacistNotificationsView />,
    'ph-messages': <PharmacistMessagesView />,
    'ph-promotions': <PharmacistPromotionsView />,
    'ph-settings': <PharmacistSettingsView />,
    'ph-reports': <PharmacistReportsView />,
    'ph-faq': <PharmacistFaqView />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
      >
        {views[currentView]}
      </motion.div>
    </AnimatePresence>
  );
}

function AdminViewRenderer() {
  const { currentView } = useAppStore();

  const views: Record<string, React.ReactNode> = {
    'admin-dashboard': <AdminDashboardView />,
    'admin-users': <AdminUsersView />,
    'admin-pharmacies': <AdminPharmaciesView />,
    'admin-orders': <AdminOrdersView />,
    'admin-medications': <AdminMedicationsView />,
    'admin-reviews': <AdminReviewsView />,
    'admin-analytics': <AdminAnalyticsView />,
    'admin-settings': <AdminSettingsView />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
      >
        {views[currentView]}
      </motion.div>
    </AnimatePresence>
  );
}

function CartFloatingButton() {
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  if (itemCount === 0) return null;

  return (
    <button
      onClick={() => setCurrentView('cart')}
      className="fixed bottom-20 right-4 z-40 lg:hidden flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full px-4 py-3 shadow-lg shadow-amber-600/30 transition-all duration-200 active:scale-95"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-semibold">{itemCount}</span>
    </button>
  );
}

function CartSidebarButton() {
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  return (
    <button
      onClick={() => setCurrentView('cart')}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${
        'text-muted-foreground hover:bg-amber-50/50 hover:text-amber-600'
      }`}
    >
      <div className="relative">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </div>
      Panier
      {itemCount > 0 && (
        <span className="ml-auto text-xs text-amber-600 font-medium">
          {itemCount} article{itemCount > 1 ? 's' : ''}
        </span>
      )}
    </button>
  );
}

export function AppShell() {
  const { currentView, setCurrentView, isAuthenticated, currentUser, setCurrentUser, logout } = useAppStore();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isAdmin = currentUser?.role === 'admin';
  const isPharmacist = currentUser?.role === 'pharmacist';

  // Check session on mount
  const checkSession = useCallback(async () => {
    try {
      const res = await fetcher('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            role: data.user.role,
            avatar: data.user.avatar,
            city: data.user.city,
            linkedPharmacyId: data.user.linkedPharmacyId || null,
          });
        }
      }
    } catch {
      // Not authenticated — show auth screen
    }
  }, [setCurrentUser]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await fetcher('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors
    }
    logout();
  }, [logout]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Pill className="h-7 w-7 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // ═══════════════════════════════════════════
  // ADMIN INTERFACE
  // ═══════════════════════════════════════════
  if (isAdmin) {
    const activeTab = adminViewToTab[currentView] || 'admin-dashboard';

    const handleTabClick = (key: AdminTabKey) => {
      setCurrentView(key);
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col z-50">
          {/* Logo */}
          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-purple-600 flex items-center justify-center">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Pharma CI</h1>
              <p className="text-[10px] text-amber-600 font-medium">Administration</p>
            </div>
          </div>

          {/* User info */}
          <div className="mx-4 mb-4 p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{currentUser?.name}</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">{currentUser?.email}</p>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
            {adminTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                      : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {tab.label}
                </button>
              );
            })}
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setCurrentView('admin-settings')}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === 'admin-settings'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                    : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-foreground'
                }`}
              >
                <Settings className="h-4.5 w-4.5" />
                Paramètres
              </button>
            </div>
          </nav>

          {/* Logout */}
          <div className="px-3 mb-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all duration-200"
            >
              Se déconnecter
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-[10px] text-muted-foreground text-center">
              Pharma CI © 2025
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <AdminViewRenderer />
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden pb-safe">
          <div className="flex items-center justify-around px-1 py-1">
            {adminTabs.slice(0, 5).map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                    isActive
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-muted-foreground hover:text-amber-600'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="text-[9px] font-medium leading-tight truncate max-w-full">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PHARMACIST INTERFACE
  // ═══════════════════════════════════════════
  if (isPharmacist) {
    const activeTab = pharmacistViewToTab[currentView] || 'ph-dashboard';

    const handleTabClick = (key: PharmacistTabKey) => {
      setCurrentView(key);
    };

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0 pt-0 lg:pl-64">
          <PharmacistViewRenderer />
        </main>

        {/* Bottom navigation (mobile) */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900/95 backdrop-blur-md border-t border-amber-100 dark:border-amber-900/50 lg:hidden pb-safe">
          <div className="flex items-center justify-around px-0.5 py-1 max-w-2xl mx-auto">
            {pharmacistTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-0.5 sm:px-1 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                    isActive
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-muted-foreground hover:text-amber-600'
                  }`}
                >
                  <Icon
                    className={`h-[18px] sm:h-5 w-[18px] sm:w-5 transition-colors ${isActive ? 'text-amber-700' : ''}`}
                  />
                  <span className="text-[9px] sm:text-[10px] font-medium leading-tight truncate max-w-full">{tab.label}</span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-amber-600 -mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar navigation (desktop) */}
        <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-950 border-r border-amber-100 dark:border-amber-900/50 flex-col z-50">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Pharma CI</h1>
              <p className="text-[10px] text-muted-foreground">Espace Pharmacien</p>
            </div>
          </div>

          <div className="mx-4 mb-4 p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{currentUser?.name}</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">{currentUser?.email}</p>
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {pharmacistTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                      : 'text-muted-foreground hover:bg-amber-50/50 hover:text-amber-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
            <div className="pt-2 mt-2 border-t border-amber-100 dark:border-amber-900/50">
              <button
                onClick={() => setCurrentView('ph-messages')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentView === 'ph-messages'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                    : 'text-muted-foreground hover:bg-amber-50/50 hover:text-amber-600'
                }`}
              >
                <MessageCircle className="h-5 w-5" />
                Messagerie
              </button>
              <button
                onClick={() => setCurrentView('ph-promotions')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentView === 'ph-promotions'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                    : 'text-muted-foreground hover:bg-amber-50/50 hover:text-amber-600'
                }`}
              >
                <Tag className="h-5 w-5" />
                Promotions
              </button>
              <button
                onClick={() => setCurrentView('ph-settings')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentView === 'ph-settings'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                    : 'text-muted-foreground hover:bg-amber-50/50 hover:text-amber-600'
                }`}
              >
                <Settings className="h-5 w-5" />
                Paramètres
              </button>
            </div>
          </nav>

          <div className="px-3 mb-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all duration-200"
            >
              Se déconnecter
            </button>
          </div>

          <div className="p-4 border-t border-amber-100 dark:border-amber-900/50">
            <p className="text-[10px] text-muted-foreground text-center">
              Pharma CI © 2025
            </p>
          </div>
        </aside>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PATIENT INTERFACE
  // ═══════════════════════════════════════════
  const activeTab = patientViewToTab[currentView] || 'home';

  const handleTabClick = (key: PatientTabKey) => {
    setCurrentView(key);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0 pt-0 lg:pl-64">
        <PatientViewRenderer />
      </main>

      {/* Cart floating button (mobile) */}
      <CartFloatingButton />

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900/95 backdrop-blur-md border-t border-amber-100 dark:border-amber-900/50 lg:hidden pb-safe">
        <div className="flex items-center justify-around px-0.5 py-1 max-w-2xl mx-auto">
          {patientTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`flex flex-col items-center justify-center gap-0.5 px-0.5 sm:px-1 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                  isActive
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                    : 'text-muted-foreground hover:text-amber-600'
                }`}
              >
                <Icon
                  className={`h-[18px] sm:h-5 w-[18px] sm:w-5 transition-colors ${isActive ? 'text-amber-700 dark:text-amber-400' : ''}`}
                />
                <span className="text-[9px] sm:text-[10px] font-medium leading-tight truncate max-w-full">{tab.label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-amber-600 -mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-950 border-r border-amber-100 dark:border-amber-900/50 flex-col z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Pharma CI</h1>
            <p className="text-[10px] text-muted-foreground">Côte d&apos;Ivoire</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {patientTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                    : 'text-muted-foreground hover:bg-amber-50/50 hover:text-amber-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
          <div className="pt-2 mt-2 border-t border-amber-100 dark:border-amber-900/50">
            <CartSidebarButton />
          </div>
        </nav>

        <div className="px-3 mb-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all duration-200"
          >
            Se déconnecter
          </button>
        </div>

        <div className="p-4 border-t border-amber-100 dark:border-amber-900/50">
          <p className="text-[10px] text-muted-foreground text-center">
            Pharma CI © 2025
          </p>
        </div>
      </aside>
    </div>
  );
}
