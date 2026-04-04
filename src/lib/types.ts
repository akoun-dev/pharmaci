/**
 * TypeScript interfaces for the application
 */

/**
 * Pharmacy interface
 */
export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string | null;
  latitude?: number;
  longitude?: number;
  phone: string;
  email?: string | null;
  isGuard: boolean;
  isOpen24h: boolean;
  isPartner: boolean;
  openTime: string;
  closeTime: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string | null;
  description?: string | null;
  services?: string;
  paymentMethods?: string;
  parkingInfo?: string | null;
  isFavorite?: boolean;
  distance?: number | null;
}

/**
 * Medication interface
 */
export interface Medication {
  id: string;
  name: string;
  commercialName: string;
  activePrinciple?: string | null;
  pathology?: string | null;
  category?: string | null;
  description?: string | null;
  dosage?: string | null;
  sideEffects?: string | null;
  needsPrescription: boolean;
  imageUrl?: string | null;
  form?: string | null;
  inStock?: boolean;
  quantity?: number;
  price?: number;
  availablePharmacyCount?: number;
  alternatives?: Medication[];
}

/**
 * User interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  password?: string | null;
  role: 'patient' | 'pharmacist' | 'admin';
  avatar?: string | null;
  address?: string | null;
  city?: string | null;
  authProvider: 'email' | 'phone' | 'google';
  phoneVerified?: Date | null;
  emailVerified?: Date | null;
  linkedPharmacyId?: string | null;
  notificationPreferences?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order interface
 */
export interface Order {
  id: string;
  userId: string;
  pharmacyId: string;
  medicationId: string;
  status: 'pending' | 'confirmed' | 'ready' | 'picked_up' | 'cancelled' | 'delivered';
  deliveryStatus: 'pickup' | 'delivery';
  quantity: number;
  totalPrice: number;
  note?: string | null;
  paymentMethod?: string | null;
  pickupTime?: string | null;
  verificationCode?: string | null;
  verifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Expanded relations
  user?: User;
  pharmacy?: Pharmacy;
  medication?: Medication;
}

/**
 * Review interface
 */
export interface Review {
  id: string;
  userId: string;
  pharmacyId: string;
  rating: number;
  comment?: string | null;
  reply?: string | null;
  replyAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Expanded relations
  user?: { name: string };
}

/**
 * Search results interface
 */
export interface SearchResults {
  medications: Medication[];
  pharmacies: Pharmacy[];
}

/**
 * API response with pagination
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Location coordinates
 */
export interface Location {
  lat: number;
  lng: number;
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Login request
 */
export interface LoginRequest {
  email?: string;
  password?: string;
  phone?: string;
  authProvider?: 'email' | 'phone';
}

/**
 * Register request
 */
export interface RegisterRequest {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  authProvider?: 'email' | 'phone';
  role?: 'patient' | 'pharmacist';
  pharmacy?: PharmacyCreate;
}

/**
 * Pharmacy creation data
 */
export interface PharmacyCreate {
  name: string;
  address: string;
  city: string;
  district?: string;
  phone: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Dashboard stats
 */
export interface DashboardStats {
  pharmacies: number;
  medications: number;
  cities: number;
  orders?: number;
  users?: number;
  revenue?: number;
}

/**
 * Order group interface - represents multiple orders from the same pharmacy
 * Used for displaying related orders together in the UI
 */
export interface OrderGroup {
  pharmacyId: string;
  pharmacy: {
    name: string;
    address: string;
    city: string;
    phone?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  orders: Order[];
  totalItems: number;
  totalPrice: number;
  status: Order['status'];
  createdAt: Date;
  verificationCodes: string[];
}
