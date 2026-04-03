'use client';

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
} from 'lucide-react';
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
import { OrderConfirmationView } from '@/components/views/order-confirmation-view';
import { OrderHistoryView } from '@/components/views/order-history-view';
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

type PatientTabKey = 'home' | 'search' | 'favorites' | 'order-history' | 'profile';
type PharmacistTabKey = 'ph-dashboard' | 'ph-stock-list' | 'ph-orders' | 'ph-notifications' | 'ph-profile';

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

export function AppShell() {
  const { currentView, setCurrentView, isAuthenticated, currentUser, setCurrentUser, logout } = useAppStore();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isPharmacist = currentUser?.role === 'pharmacist';

  // Check session on mount
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
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
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors
    }
    logout();
  }, [logout]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
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

  if (isPharmacist) {
    const activeTab = pharmacistViewToTab[currentView] || 'ph-dashboard';
    const isDetailView =
      currentView === 'ph-stock-detail' ||
      currentView === 'ph-stock-add' ||
      currentView === 'ph-order-detail' ||
      currentView === 'ph-messages' ||
      currentView === 'ph-promotions' ||
      currentView === 'ph-settings' ||
      currentView === 'ph-reports' ||
      currentView === 'ph-faq';

    const handleTabClick = (key: PharmacistTabKey) => {
      setCurrentView(key);
    };

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0 pt-0 lg:pl-64">
          <PharmacistViewRenderer />
        </main>

        {/* Bottom navigation (mobile) */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900/95 backdrop-blur-md border-t border-emerald-100 dark:border-emerald-900/50 lg:hidden pb-safe">
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
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-muted-foreground hover:text-emerald-600'
                  }`}
                >
                  <Icon
                    className={`h-[18px] sm:h-5 w-[18px] sm:w-5 transition-colors ${isActive ? 'text-emerald-700' : ''}`}
                  />
                  <span className="text-[9px] sm:text-[10px] font-medium leading-tight truncate max-w-full">{tab.label}</span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-emerald-600 -mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar navigation (desktop) */}
        <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-950 border-r border-emerald-100 dark:border-emerald-900/50 flex-col z-50">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">PharmApp CI</h1>
              <p className="text-[10px] text-muted-foreground">Espace Pharmacien</p>
            </div>
          </div>

          {/* User info */}
          <div className="mx-4 mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{currentUser?.name}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{currentUser?.email}</p>
          </div>

          {/* Nav items */}
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
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                      : 'text-muted-foreground hover:bg-emerald-50/50 hover:text-emerald-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
            <div className="pt-2 mt-2 border-t border-emerald-100 dark:border-emerald-900/50">
              <button
                onClick={() => setCurrentView('ph-messages')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentView === 'ph-messages'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                    : 'text-muted-foreground hover:bg-emerald-50/50 hover:text-emerald-600'
                }`}
              >
                <MessageCircle className="h-5 w-5" />
                Messagerie
              </button>
              <button
                onClick={() => setCurrentView('ph-promotions')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentView === 'ph-promotions'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                    : 'text-muted-foreground hover:bg-emerald-50/50 hover:text-emerald-600'
                }`}
              >
                <Tag className="h-5 w-5" />
                Promotions
              </button>
              <button
                onClick={() => setCurrentView('ph-settings')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentView === 'ph-settings'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                    : 'text-muted-foreground hover:bg-emerald-50/50 hover:text-emerald-600'
                }`}
              >
                <Settings className="h-5 w-5" />
                Paramètres
              </button>
            </div>
          </nav>

          {/* Logout */}
          <div className="px-3 mb-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all duration-200"
            >
              Se déconnecter
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-emerald-100 dark:border-emerald-900/50">
            <p className="text-[10px] text-muted-foreground text-center">
              PharmApp CI © 2025
            </p>
          </div>
        </aside>
      </div>
    );
  }

  // === PATIENT INTERFACE ===
  const activeTab = patientViewToTab[currentView] || 'home';
  const isDetailView =
    currentView === 'pharmacy-detail' ||
    currentView === 'medication-detail' ||
    currentView === 'pharmacy-dashboard' ||
    currentView === 'order-confirmation';

  const handleTabClick = (key: PatientTabKey) => {
    setCurrentView(key);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0 pt-0 lg:pl-64">
        <PatientViewRenderer />
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900/95 backdrop-blur-md border-t border-emerald-100 dark:border-emerald-900/50 lg:hidden pb-safe">
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
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                    : 'text-muted-foreground hover:text-emerald-600'
                }`}
              >
                <Icon
                  className={`h-[18px] sm:h-5 w-[18px] sm:w-5 transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
                />
                <span className="text-[9px] sm:text-[10px] font-medium leading-tight truncate max-w-full">{tab.label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-emerald-600 -mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar navigation (desktop) */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-950 border-r border-emerald-100 dark:border-emerald-900/50 flex-col z-50">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">PharmApp CI</h1>
            <p className="text-[10px] text-muted-foreground">Côte d&apos;Ivoire</p>
          </div>
        </div>

        {/* Nav items */}
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
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                    : 'text-muted-foreground hover:bg-emerald-50/50 hover:text-emerald-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Logout in sidebar */}
        <div className="px-3 mb-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all duration-200"
          >
            Se déconnecter
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-100 dark:border-emerald-900/50">
          <p className="text-[10px] text-muted-foreground text-center">
            PharmApp CI © 2025
          </p>
        </div>
      </aside>
    </div>
  );
}
