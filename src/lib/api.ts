// Client-side API helpers for PHARMACI

import type { AuthUser } from "@/lib/store";

async function request<T>(
  url: string,
  options?: RequestInit & { signal?: AbortSignal; silent401?: boolean }
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
    signal: options?.signal,
  });
  
  if (res.status === 401) {
    if (typeof window !== "undefined" && !options?.silent401) {
      const { useAppStore } = await import("@/lib/store");
      useAppStore.getState().pushToast("Session expirée. Veuillez vous reconnecter.", "error");
      useAppStore.getState().setUser(null);
    }
    throw new Error("Session expirée");
  }
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Une erreur est survenue");
  }
  return data as T;
}

export const api = {
  get: <T>(url: string, signal?: AbortSignal) => request<T>(url, { signal }),
  post: <T>(url: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined, signal }),
  put: <T>(url: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(url, { method: "PUT", body: body ? JSON.stringify(body) : undefined, signal }),
  del: <T>(url: string, signal?: AbortSignal) => request<T>(url, { method: "DELETE", signal }),
};

// ---------- Types ----------
export interface Medication {
  id: string;
  name: string;
  activeIngredient: string;
  category: string;
  dosage: string;
  form: string;
  description: string;
  prescriptionRequired: boolean;
  imageUrl: string | null;
  sideEffects: string;
  contraindications: string;
  minPrice: number | null;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  latitude: number;
  longitude: number;
  phone: string;
  email: string | null;
  openingTime: string;
  closingTime: string;
  isOpen24h: boolean;
  isOnGuard: boolean;
  isVerified: boolean;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  services: string;
  payments: string;
}

export interface PharmacyMedication {
  id: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  expiryDate: string | null;
  medication: Medication;
}

export interface PharmacyWithStock extends Pharmacy {
  medications?: PharmacyMedication[];
  reviews?: Review[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface OrderItem {
  id: string;
  medicationId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  medication?: Medication;
}

export interface Order {
  id: string;
  code: string;
  userId: string;
  pharmacyId: string;
  status: "PENDING" | "CONFIRMED" | "READY" | "PICKED_UP" | "CANCELLED";
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  pharmacy?: Pharmacy;
  user?: AuthUser;
  items?: OrderItem[];
}

// ---------- Auth ----------
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: AuthUser }>("/api/auth/login", { email, password }),
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => api.post<{ user: AuthUser }>("/api/auth/register", data),
  me: () => request<{ user: AuthUser & { pharmacy?: { id: string } } }>("/api/auth/me", { silent401: true }),
  logout: () => api.post<{ success: boolean }>("/api/auth/logout"),
  updateProfile: (data: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
    avatarUrl?: string;
  }) => api.put<{ user: AuthUser }>("/api/auth/update-profile", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<{ success: boolean }>("/api/auth/change-password", {
      currentPassword,
      newPassword,
    }),
};

// ---------- Medications ----------
export interface PharmacyWithPrice {
  pharmacy: Pharmacy;
  price: number;
  stock: number;
  pmId: string;
}
export const medicationApi = {
  list: (params?: { search?: string; category?: string; sort?: string; prescriptionOnly?: boolean; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.category) q.set("category", params.category);
    if (params?.sort) q.set("sort", params.sort);
    if (params?.prescriptionOnly) q.set("prescriptionOnly", "true");
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return api.get<{
      medications: Medication[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/medications${q.toString() ? `?${q.toString()}` : ""}`);
  },
  get: (id: string) => api.get<Medication>(`/api/medications/${id}`),
  categories: () => api.get<{ categories: string[] }>("/api/medications/categories"),
  pharmacies: (id: string) =>
    api.get<{ pharmacies: PharmacyWithPrice[]; total: number }>(
      `/api/medications/${id}/pharmacies`
    ),
};

// ---------- Pharmacies ----------
export const pharmacyApi = {
  list: (params?: {
    search?: string;
    city?: string;
    district?: string;
    onGuard?: boolean;
    open24h?: boolean;
    openNow?: boolean;
    service?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    });
    return api.get<{
      pharmacies: Pharmacy[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/pharmacies${q.toString() ? `?${q.toString()}` : ""}`);
  },
  get: (id: string) =>
    api.get<PharmacyWithStock>(`/api/pharmacies/${id}`),
  medications: (id: string, params?: { search?: string; inStock?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.inStock) q.set("inStock", "true");
    return api.get<{ medications: PharmacyMedication[]; total: number }>(
      `/api/pharmacies/${id}/medications${q.toString() ? `?${q.toString()}` : ""}`
    );
  },
  reviews: (id: string) =>
    api.get<{ reviews: Review[]; total: number }>(`/api/pharmacies/${id}/reviews`),
  addReview: (id: string, rating: number, comment: string) =>
    api.post<{ review: Review }>(`/api/pharmacies/${id}/reviews`, {
      rating,
      comment,
    }),
  favorite: {
    get: (id: string) =>
      api.get<{ isFavorite: boolean }>(`/api/pharmacies/${id}/favorite`),
    add: (id: string) =>
      api.post<{ success: boolean }>(`/api/pharmacies/${id}/favorite`),
    remove: (id: string) =>
      api.del<{ success: boolean }>(`/api/pharmacies/${id}/favorite`),
  },
  favorites: () => api.get<{ pharmacies: Pharmacy[] }>("/api/favorites"),
};

// ---------- Pharmacist Stock (Excel Import/Export) ----------
export const pharmacistStockApi = {
  exportUrl: () => "/api/pharmacist/stock/export",
  /**
   * Export stock as XLSX. Triggers a file download.
   */
  exportExcel: async () => {
    const res = await fetch("/api/pharmacist/stock/export");
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erreur d'export" }));
      throw new Error((err as { error?: string }).error || "Erreur d'export");
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^";]+)"?/);
    const filename = match ? match[1] : `stock_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  /**
   * Import stock from an XLSX file. Returns result with counts.
   */
  importExcel: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/pharmacist/stock/import", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data as { error?: string }).error || "Erreur d'import");
    }
    return data as {
      success: boolean;
      imported: number;
      errors?: string[];
      details: { totalRows: number; imported: number; failed: number };
    };
  },
};

// ---------- Orders ----------
export const orderApi = {
  list: (params?: { status?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    return api.get<{ orders: Order[] }>(
      `/api/orders${q.toString() ? `?${q.toString()}` : ""}`
    );
  },
  get: (id: string) => api.get<{ order: Order }>(`/api/orders/${id}`),
  create: (data: {
    pharmacyId: string;
    items: { medicationId: string; quantity: number }[];
    notes?: string;
  }) => api.post<{ order: Order }>("/api/orders", data),
  updateStatus: (id: string, status: string) =>
    api.put<{ order: Order }>(`/api/orders/${id}`, { status }),
  cancel: (id: string) =>
    api.post<{ order: Order }>(`/api/orders/${id}/cancel`),
  getByCode: (code: string) =>
    api.get<{ order: Order }>(`/api/orders/code/${code}`),
};

// ---------- Utilities ----------
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " CFA";
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  return formatDate(dateStr);
}

// Haversine distance in km
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Generate a personalized notification message for a pharmacist
export function pharmacistNotificationMessage(
  status: Order["status"],
  userName: string,
  code: string,
  pharmacyName: string
): string {
  const user = userName || "Un client";
  switch (status) {
    case "PENDING":
      return `Nouvelle commande #${code} de ${user} — en attente de confirmation`;
    case "CONFIRMED":
      return `Commande #${code} confirmée pour ${user}`;
    case "READY":
      return `Commande #${code} marquée comme prête pour ${user}`;
    case "PICKED_UP":
      return `${user} a récupéré la commande #${code} — merci !`;
    case "CANCELLED":
      return `Commande #${code} annulée par ${user}`;
    default:
      return `Mise à jour de la commande #${code} de ${user}`;
  }
}

// Generate a personalized notification message for an order status change (patient)
export function notificationMessage(
  status: Order["status"],
  pharmacyName: string,
  code: string
): string {
  const pharmacy = pharmacyName || "la pharmacie";
  switch (status) {
    case "PENDING":
      return `Commande #${code} créée chez ${pharmacy} — en attente de confirmation`;
    case "CONFIRMED":
      return `${pharmacy} a confirmé votre commande #${code} — elle sera bientôt prête`;
    case "READY":
      return `Votre commande #${code} est prête chez ${pharmacy} ! Venez la récupérer`;
    case "PICKED_UP":
      return `Vous avez récupéré votre commande #${code} chez ${pharmacy} — merci !`;
    case "CANCELLED":
      return `Commande #${code} annulée chez ${pharmacy}`;
    default:
      return `Mise à jour de la commande #${code} chez ${pharmacy}`;
  }
}

// Order status labels and colors
export const ORDER_STATUS = {
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Confirmée", color: "bg-blue-100 text-blue-700" },
  READY: { label: "Prête", color: "bg-green-100 text-green-700" },
  PICKED_UP: { label: "Récupérée", color: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-700" },
} as const;
