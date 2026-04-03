import { create } from 'zustand';

interface HistoryEntry {
  view: View;
  selectedPharmacyId: string | null;
  selectedMedicationId: string | null;
  selectedOrderId: string | null;
  selectedStockId: string | null;
}

export type View =
  // Patient views
  | 'home'
  | 'search'
  | 'map'
  | 'pharmacy-detail'
  | 'medication-detail'
  | 'profile'
  | 'pharmacy-dashboard'
  | 'favorites'
  | 'order-confirmation'
  | 'order-history'
  // Pharmacist views
  | 'ph-dashboard'
  | 'ph-stock-list'
  | 'ph-stock-detail'
  | 'ph-stock-add'
  | 'ph-orders'
  | 'ph-order-detail'
  | 'ph-profile'
  | 'ph-notifications'
  | 'ph-messages'
  | 'ph-promotions'
  | 'ph-settings'
  | 'ph-reports'
  | 'ph-faq'
  // Admin views
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-pharmacies'
  | 'admin-orders'
  | 'admin-medications'
  | 'admin-reviews'
  | 'admin-analytics'
  | 'admin-settings';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  city: string | null;
  linkedPharmacyId: string | null;
}

interface AppState {
  currentView: View;
  previousView: View | null;
  viewHistory: HistoryEntry[];
  darkMode: boolean;
  selectedPharmacyId: string | null;
  selectedMedicationId: string | null;
  selectedOrderId: string | null;
  selectedStockId: string | null;
  searchQuery: string;
  currentUserId: string;
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  setCurrentView: (view: View) => void;
  goBack: () => void;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  selectPharmacy: (id: string) => void;
  selectMedication: (id: string) => void;
  selectOrder: (id: string) => void;
  selectStock: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setCurrentUser: (user: CurrentUser | null) => void;
  logout: () => void;
  getPreviousView: () => View | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  previousView: null,
  viewHistory: [],
  darkMode: false,
  selectedPharmacyId: null,
  selectedMedicationId: null,
  selectedOrderId: null,
  selectedStockId: null,
  searchQuery: '',
  currentUserId: '',
  currentUser: null,
  isAuthenticated: false,

  setCurrentView: (view) =>
    set((state) => {
      // Push current state to history before switching
      const newHistory: HistoryEntry[] = [
        ...state.viewHistory.slice(-(20 - 1)), // keep max 19 to leave room for new entry
        {
          view: state.currentView,
          selectedPharmacyId: state.selectedPharmacyId,
          selectedMedicationId: state.selectedMedicationId,
          selectedOrderId: state.selectedOrderId,
          selectedStockId: state.selectedStockId,
        },
      ];
      return {
        previousView: state.currentView,
        currentView: view,
        viewHistory: newHistory,
      };
    }),

  goBack: () =>
    set((state) => {
      if (state.viewHistory.length === 0) {
        // No history — go to default view
        const role = state.currentUser?.role;
        let defaultView: View = 'home';
        if (role === 'pharmacist') defaultView = 'ph-dashboard';
        else if (role === 'admin') defaultView = 'admin-dashboard';
        return {
          currentView: defaultView,
          previousView: null,
          selectedPharmacyId: null,
          selectedMedicationId: null,
          selectedOrderId: null,
          selectedStockId: null,
        };
      }
      // Pop last entry from history
      const newHistory = [...state.viewHistory];
      const entry = newHistory.pop()!;
      return {
        currentView: entry.view,
        previousView: newHistory.length > 0 ? newHistory[newHistory.length - 1].view : null,
        viewHistory: newHistory,
        selectedPharmacyId: entry.selectedPharmacyId,
        selectedMedicationId: entry.selectedMedicationId,
        selectedOrderId: entry.selectedOrderId,
        selectedStockId: entry.selectedStockId,
      };
    }),

  getPreviousView: () => {
    const state = get();
    if (state.viewHistory.length > 0) {
      return state.viewHistory[state.viewHistory.length - 1].view;
    }
    return null;
  },

  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', newDarkMode);
      }
      // Persist preference
      try {
        localStorage.setItem('pharmapp-dark-mode', JSON.stringify(newDarkMode));
      } catch {
        // Ignore storage errors
      }
      return { darkMode: newDarkMode };
    }),

  setDarkMode: (enabled: boolean) =>
    set(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', enabled);
      }
      try {
        localStorage.setItem('pharmapp-dark-mode', JSON.stringify(enabled));
      } catch {
        // Ignore storage errors
      }
      return { darkMode: enabled };
    }),

  selectPharmacy: (id) =>
    set(() => ({
      selectedPharmacyId: id,
    })),

  selectMedication: (id) =>
    set(() => ({
      selectedMedicationId: id,
    })),

  selectOrder: (id) =>
    set(() => ({
      selectedOrderId: id,
    })),

  selectStock: (id) =>
    set(() => ({
      selectedStockId: id,
    })),

  setSearchQuery: (query) =>
    set(() => ({
      searchQuery: query,
    })),

  setCurrentUser: (user) =>
    set(() => {
      // Restore dark mode preference from localStorage
      let darkMode = false;
      try {
        const stored = localStorage.getItem('pharmapp-dark-mode');
        if (stored !== null) {
          darkMode = JSON.parse(stored);
        }
      } catch {
        // Ignore
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', darkMode);
      }
      return {
        currentUser: user,
        isAuthenticated: !!user,
        currentUserId: user?.id || '',
        currentView: user?.role === 'admin' ? 'admin-dashboard' : user?.role === 'pharmacist' ? 'ph-dashboard' : 'home',
        viewHistory: [],
        previousView: null,
        darkMode,
      };
    }),

  logout: () =>
    set(() => ({
      currentUser: null,
      isAuthenticated: false,
      currentUserId: '',
      currentView: 'home',
      viewHistory: [],
      previousView: null,
    })),
}));
