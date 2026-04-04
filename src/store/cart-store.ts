import { logger } from '@/lib/logger';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique key: pharmacyId_medicationId
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyDistrict: string;
  medicationId: string;
  medicationName: string;
  medicationForm: string;
  price: number;
  quantity: number;
  needsPrescription: boolean;
  stockId: string;
  maxQuantity: number;
}

interface CartState {
  items: CartItem[];
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress: string;
  note: string;
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryType: (type: 'pickup' | 'delivery') => void;
  setDeliveryAddress: (address: string) => void;
  setNote: (note: string) => void;
  setPaymentMethod: (method: string) => void;
  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getPharmacyGroups: () => Map<string, CartItem[]>;
  getTotal: () => number;
  hasItem: (pharmacyId: string, medicationId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryType: 'pickup',
      deliveryAddress: '',
      note: '',

      addItem: (item) =>
        set((state) => {
          const id = `${item.pharmacyId}_${item.medicationId}`;
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            // Increase quantity
            const newQty = Math.min(existing.quantity + item.quantity, existing.maxQuantity);
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: newQty } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, id },
            ],
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) }
              : i
          ),
        })),

      clearCart: () =>
        set(() => ({
          items: [],
          deliveryType: 'pickup',
          deliveryAddress: '',
          note: '',
        })),

      setDeliveryType: (type) => set(() => ({ deliveryType: type })),
      setDeliveryAddress: (address) => set(() => ({ deliveryAddress: address })),
      setNote: (note) => set(() => ({ note })),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getPharmacyGroups: () => {
        const groups = new Map<string, CartItem[]>();
        for (const item of get().items) {
          const existing = groups.get(item.pharmacyId) || [];
          existing.push(item);
          groups.set(item.pharmacyId, existing);
        }
        return groups;
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      hasItem: (pharmacyId, medicationId) => {
        const id = `${pharmacyId}_${medicationId}`;
        return get().items.some((i) => i.id === id);
      },
    }),
    {
      name: 'pharma-ci-cart',
    }
  )
);
