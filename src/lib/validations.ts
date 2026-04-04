/**
 * Shared Zod validation schemas for API routes
 */
import { z } from 'zod';

/**
 * Password validation with strength levels:
 * Level 1: Minimum 8 characters (weak but acceptable)
 * Level 2: 8+ chars with mixed case and/or numbers (medium)
 * Level 3: 12+ chars with mixed case, numbers, and special char (strong)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .refine(
    (pwd) => /[A-Z]/.test(pwd) || /[a-z]/.test(pwd) || /[0-9]/.test(pwd),
    'Le mot de passe doit contenir une combinaison de lettres et/ou chiffres'
  );

/**
 * Strong password validation for sensitive accounts (admin, pharmacist)
 */
export const strongPasswordSchema = z
  .string()
  .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Doit contenir au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Doit contenir au moins un caractère spécial');

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .min(1, 'L\'email est requis')
  .email('Format d\'email invalide');

/**
 * CI phone number validation (+225 or 0 followed by 9 digits)
 */
export const ciPhoneSchema = z
  .string()
  .regex(/^(\+225|0)[1-9]\d{8}$/, 'Numéro de téléphone invalide (format CI: +225 XX XX XX XX ou 0X XX XX XX XX)')
  .transform((phone) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    return cleanPhone.startsWith('+225') ? cleanPhone : cleanPhone.replace(/^0/, '+225');
  });

/**
 * Search query validation - prevents injection
 */
export const searchQuerySchema = z
  .string()
  .max(100, 'La recherche est trop longue')
  .transform((q) => q.trim())
  .refine((q) => q.length > 0 || q === '', 'Recherche invalide');

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * ID validation
 */
export const idSchema = z
  .string()
  .min(1, 'ID requis')
  .regex(/^[a-z0-9]+$/, 'ID invalide');

/**
 * Pharmacy ID validation (from URL params)
 */
export const pharmacyIdSchema = z.object({
  id: z.string().min(1, 'ID de pharmacie requis'),
});

/**
 * Medication ID validation (from URL params)
 */
export const medicationIdSchema = z.object({
  id: z.string().min(1, 'ID de médicament requis'),
});

/**
 * User ID validation (from URL params)
 */
export const userIdSchema = z.object({
  id: z.string().min(1, 'ID d\'utilisateur requis'),
});

/**
 * Sanitizes a string input for database queries
 * Removes potentially dangerous characters while preserving allowed content
 */
export function sanitizeSearchQuery(query: string | undefined): string | undefined {
  if (!query) return undefined;
  return query
    .trim()
    .slice(0, 100) // Limit length
    .replace(/[<>\"']/g, ''); // Remove HTML/JS injection characters
}

/**
 * Validates and sanitizes search parameters for pharmacy/medication search
 */
export const searchParamsSchema = z.object({
  q: z.string().max(100).optional().transform(sanitizeSearchQuery),
  city: z.string().max(50).optional(),
  district: z.string().max(50).optional(),
  isGuard: z.enum(['true', 'false']).optional(),
  is24h: z.enum(['true', 'false']).optional(),
  category: z.string().max(50).optional(),
  pathology: z.string().max(100).optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
