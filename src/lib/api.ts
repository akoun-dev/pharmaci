// Client-side API helpers for PHARMACI

import type { AuthUser } from "@/lib/store";

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Une erreur est survenue");
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => request<T>(url, { method: "DELETE" }),
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
    role?: "PATIENT" | "PHARMACIST";
  }) => api.post<{ user: AuthUser }>("/api/auth/register", data),
  me: () => api.get<{ user: AuthUser & { pharmacy?: { id: string } } }>("/api/auth/me"),
  logout: () => api.post<{ success: boolean }>("/api/auth/logout"),
  updateProfile: (data: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
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
  list: (params?: { search?: string; category?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.category) q.set("category", params.category);
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

// Order status labels and colors
export const ORDER_STATUS = {
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Confirmée", color: "bg-blue-100 text-blue-700" },
  READY: { label: "Prête", color: "bg-green-100 text-green-700" },
  PICKED_UP: { label: "Récupérée", color: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-700" },
} as const;
