/**
 * Shared constants used across the application
 */

/**
 * Order status configuration
 */
export const ORDER_STATUS = {
  pending: { label: 'En attente', color: 'yellow', icon: 'Clock' },
  confirmed: { label: 'Confirmée', color: 'blue', icon: 'CheckCircle' },
  ready: { label: 'Prête', color: 'green', icon: 'Package' },
  picked_up: { label: 'Récupérée', color: 'emerald', icon: 'PackageCheck' },
  cancelled: { label: 'Annulée', color: 'red', icon: 'XCircle' },
  delivered: { label: 'Livrée', color: 'green', icon: 'Truck' },
} as const;

export type OrderStatusKey = keyof typeof ORDER_STATUS;

/**
 * Order status filter tabs
 */
export const ORDER_FILTER_TABS = [
  { id: 'all', label: 'Toutes', value: '' },
  { id: 'pending', label: 'En attente', value: 'pending' },
  { id: 'confirmed', label: 'Confirmées', value: 'confirmed' },
  { id: 'ready', label: 'Prêtes', value: 'ready' },
  { id: 'picked_up', label: 'Récupérées', value: 'picked_up' },
  { id: 'cancelled', label: 'Annulées', value: 'cancelled' },
] as const;

/**
 * Payment method labels
 */
export const PAYMENT_METHODS: Record<string, string> = {
  especes: 'Espèces',
  orange_money: 'Orange Money',
  wave: 'Wave',
  mtn_money: 'MTN Money',
  carte: 'Carte bancaire',
  visa: 'Visa',
  mastercard: 'Mastercard',
};

/**
 * Pharmacy service labels
 */
export const PHARMACY_SERVICES: Record<string, string> = {
  livraison: 'Livraison',
  conseil: 'Conseil',
  drive: 'Drive',
  ordonnance: 'Ordonnance',
  urgent: 'Urgence',
  parapharmacie: 'Parapharmacie',
};

/**
 * User roles
 */
export const USER_ROLES = {
  patient: 'Patient',
  pharmacist: 'Pharmacien',
  admin: 'Administrateur',
} as const;

/**
 * Admin filter tabs
 */
export const ADMIN_FILTER_TABS = [
  { id: 'all', label: 'Tous', value: '' },
  { id: 'patient', label: 'Patients', value: 'patient' },
  { id: 'pharmacist', label: 'Pharmaciens', value: 'pharmacist' },
  { id: 'admin', label: 'Admins', value: 'admin' },
] as const;

/**
 * Medication categories
 */
export const MEDICATION_CATEGORIES = [
  'Antalgique',
  'Antibiotique',
  'Antidiabétique',
  'Antipaludéen',
  'Antihistaminique',
  'Antihypertenseur',
  'Anti-inflammatoire',
  'Bronchodilatateur',
  'Antiacide',
  'Supplément',
] as const;

/**
 * CI cities for dropdowns
 */
export const IVORY_COAST_CITIES = [
  'Abidjan',
  'Bouaké',
  'San Pedro',
  'Yamoussoukro',
  'Korhogo',
  'Daloa',
  'Grand-Bassam',
] as const;

/**
 * Time constants
 */
export const TIME_CONSTANTS = {
  OTP_EXPIRY_SECONDS: 5 * 60, // 5 minutes
  OTP_EXPIRY_MS: 5 * 60 * 1000,
  SESSION_DURATION_DAYS: 7,
  SESSION_DURATION_MS: 7 * 24 * 60 * 60 * 1000,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * File upload constraints
 */
export const UPLOAD_LIMITS = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_WIDTH: 1200,
  MAX_IMAGE_HEIGHT: 1200,
} as const;

/**
 * Password requirements
 */
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  STRONG_MIN_LENGTH: 10,
  MAX_LENGTH: 128,
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    google: '/api/auth/google',
  },
  medications: '/api/medications',
  pharmacies: '/api/pharmacies',
  orders: '/api/orders',
  reviews: '/api/reviews',
} as const;

/**
 * Animation durations (in ms)
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;
