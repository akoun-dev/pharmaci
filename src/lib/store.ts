"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "PATIENT" | "PHARMACIST" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  pharmacyId?: string | null;
}

// Navigation tabs
export type MainTab = "home" | "map" | "cart" | "orders" | "profile" | "pharmacist" | "admin";

// Cart item
export interface CartItem {
  medicationId: string;
  medicationName: string;
  medicationDosage: string;
  medicationForm: string;
  pharmacyId: string;
  pharmacyName: string;
  unitPrice: number;
  quantity: number;
  prescriptionRequired: boolean;
}

// Full app navigation state
export interface NavState {
  // Main tab
  tab: MainTab;
  // Sub-view within tab (e.g. "pharmacy-detail", "medication-detail", "checkout", etc.)
  view: string;
  // Optional payload (e.g. id of pharmacy, medication, order)
  params: Record<string, string>;
  // Previous states for back navigation
  history: { tab: MainTab; view: string; params: Record<string, string> }[];
}

interface AppState {
  // Auth
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;

  // Navigation
  nav: NavState;
  setTab: (tab: MainTab, params?: Record<string, string>) => void;
  navigate: (view: string, params?: Record<string, string>) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  resetNav: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (medicationId: string, pharmacyId: string, quantity: number) => void;
  removeFromCart: (medicationId: string, pharmacyId: string) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartCount: () => number;

  // Onboarding
  onboardingDone: boolean;
  setOnboardingDone: () => void;

  // Guest mode
  guestMode: boolean;
  setGuestMode: (v: boolean) => void;

  // Recently viewed medications
  recentlyViewed: { id: string; name: string; category: string; dosage: string; form: string }[];
  addRecentlyViewed: (med: { id: string; name: string; category: string; dosage: string; form: string }) => void;

  // Recent searches
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;

  // User position (lat, lng)
  userPosition: [number, number] | null;
  setUserPosition: (pos: [number, number]) => void;

  // Notifications
  notificationCount: number;
  setNotificationCount: (count: number) => void;

  // Toast trigger (simple in-memory)
  toastQueue: { id: number; message: string; type: "success" | "error" | "info"; actionLabel?: string; onAction?: () => void }[];
  pushToast: (message: string, type?: "success" | "error" | "info", options?: { actionLabel?: string; onAction?: () => void }) => void;
  dismissToast: (id: number) => void;
}

const defaultNav: NavState = {
  tab: "home",
  view: "home",
  params: {},
  history: [],
};

let toastIdCounter = 0;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---------- Auth ----------
      user: null,
      setUser: (user) => set({ user, ...(user ? {} : { notificationCount: 0 }) }),
      logout: () => set({ user: null, nav: defaultNav, cart: [] }),

      // ---------- Navigation ----------
      nav: defaultNav,
  setTab: (tab, params = {}) =>
    set((state) => ({
      nav: { tab, view: tab, params, history: [] },
    })),
      navigate: (view, params = {}) =>
        set((state) => {
          const current = state.nav;
          return {
            nav: {
              tab: current.tab,
              view,
              params,
              history: [
                ...current.history,
                { tab: current.tab, view: current.view, params: current.params },
              ].slice(-30), // Keep last 30 entries
            },
          };
        }),
      goBack: () =>
        set((state) => {
          if (state.nav.history.length === 0) return state;
          const history = [...state.nav.history];
          const prev = history.pop()!;
          return { nav: { ...prev, history } };
        }),
      canGoBack: () => get().nav.history.length > 0,
      resetNav: () => set({ nav: defaultNav }),

      // ---------- Cart ----------
      cart: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find(
            (c) =>
              c.medicationId === item.medicationId &&
              c.pharmacyId === item.pharmacyId
          );
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.medicationId === item.medicationId &&
                c.pharmacyId === item.pharmacyId
                  ? { ...c, quantity: c.quantity + item.quantity }
                  : c
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      updateCartQuantity: (medicationId, pharmacyId, quantity) =>
        set((state) => ({
          cart: state.cart
            .map((c) =>
              c.medicationId === medicationId && c.pharmacyId === pharmacyId
                ? { ...c, quantity }
                : c
            )
            // A quantity of 0 or less removes the line item entirely.
            .filter((c) => c.quantity > 0),
        })),
      removeFromCart: (medicationId, pharmacyId) =>
        set((state) => ({
          cart: state.cart.filter(
            (c) =>
              !(
                c.medicationId === medicationId &&
                c.pharmacyId === pharmacyId
              )
          ),
        })),
      clearCart: () => set({ cart: [] }),
      cartTotal: () =>
        get().cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      cartCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),

      // ---------- Onboarding ----------
      onboardingDone: false,
      setOnboardingDone: () => set({ onboardingDone: true }),

      // ---------- Guest mode ----------
      guestMode: false,
      setGuestMode: (v) => set({ guestMode: v, notificationCount: 0 }),

      // ---------- Recently viewed ----------
      recentlyViewed: [],
      addRecentlyViewed: (med) =>
        set((state) => {
          const filtered = state.recentlyViewed.filter((m) => m.id !== med.id);
          return { recentlyViewed: [med, ...filtered].slice(0, 10) };
        }),

      // ---------- Recent searches ----------
      recentSearches: [],
      addRecentSearch: (term) =>
        set((state) => {
          const trimmed = term.trim();
          if (!trimmed) return state;
          const filtered = state.recentSearches.filter(
            (s) => s.toLowerCase() !== trimmed.toLowerCase()
          );
          return { recentSearches: [trimmed, ...filtered].slice(0, 8) };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),

      // ---------- User Position ----------
      userPosition: null,
      setUserPosition: (pos) => set({ userPosition: pos }),

      // ---------- Notifications ----------
      notificationCount: 0,
      setNotificationCount: (count) => set({ notificationCount: count }),

      // ---------- Toasts ----------
      toastQueue: [],
      pushToast: (message, type = "info", options) =>
        set((state) => ({
          toastQueue: [
            ...state.toastQueue,
            { id: ++toastIdCounter, message, type, actionLabel: options?.actionLabel, onAction: options?.onAction },
          ],
        })),
      dismissToast: (id) =>
        set((state) => ({
          toastQueue: state.toastQueue.filter((t) => t.id !== id),
        })),
    }),
    {
      name: "pharmaci-store",
      // Only persist user, cart, recent searches — NOT navigation (always start at home)
      partialize: (state) => ({
        user: state.user,
        cart: state.cart,
        recentSearches: state.recentSearches,
        recentlyViewed: state.recentlyViewed,
        guestMode: state.guestMode,
        userPosition: state.userPosition,
        onboardingDone: state.onboardingDone,
        notificationCount: state.notificationCount,
      }),
    }
  )
);
