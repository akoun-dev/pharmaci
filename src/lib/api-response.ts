import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';

/**
 * Standard API response types
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Predefined error types
 */
export const Errors = {
  // Authentication & Authorization
  unauthorized: (message = 'Authentification requise') =>
    new ApiError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Accès refusé') =>
    new ApiError(message, 403, 'FORBIDDEN'),

  // Validation
  validation: (message = 'Données invalides', details?: unknown) =>
    new ApiError(message, 400, 'VALIDATION_ERROR', details),

  notFound: (resource = 'Ressource') =>
    new ApiError(`${resource} non trouvée`, 404, 'NOT_FOUND'),

  conflict: (message = 'Conflit de données') =>
    new ApiError(message, 409, 'CONFLICT'),

  // Rate limiting
  rateLimit: (message = 'Trop de requêtes. Réessayez plus tard.') =>
    new ApiError(message, 429, 'RATE_LIMIT_EXCEEDED'),

  // Server errors
  internal: (message = 'Une erreur est survenue') =>
    new ApiError(message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (message = 'Service temporairement indisponible') =>
    new ApiError(message, 503, 'SERVICE_UNAVAILABLE'),
};

/**
 * Success response helper
 */
export function apiSuccess<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: statusCode }
  );
}

/**
 * Success response with pagination helper
 */
export function apiSuccessPaginated<T>(
  items: T[],
  pagination: { page: number; limit: number; total: number },
  message?: string
): NextResponse<ApiSuccessResponse<T[]>> {
  return NextResponse.json({
    success: true,
    data: items,
    ...(message && { message }),
    pagination: {
      ...pagination,
      pages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

/**
 * Error response helper
 */
export function apiError(
  error: unknown,
  context?: string
): NextResponse<ApiErrorResponse> {
  // Log error for debugging
  if (error instanceof Error) {
    logger.error(`${context || 'API Error'}:`, error.message, error);
  } else {
    logger.error(`${context || 'API Error'}:`, error);
  }

  // ApiError instances
  if (error instanceof ApiError) {
    const responseData: ApiErrorResponse = {
      success: false,
      error: error.message,
    };
    if (error.code) responseData.code = error.code;
    if (error.details) responseData.details = error.details;
    return NextResponse.json(responseData, { status: error.statusCode });
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Données invalides',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      },
      { status: 400 }
    );
  }

  // Generic errors - don't expose details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (error instanceof Error) {
    // Known error types with safe messages
    if (error.name === 'PrismaClientKnownRequestError') {
      return NextResponse.json(
        { success: false, error: 'Erreur de base de données' },
        { status: 500 }
      );
    }

    if (error.name === 'PrismaClientValidationError') {
      return NextResponse.json(
        { success: false, error: 'Données invalides', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // In development, expose error details
    if (isDevelopment) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          ...(error.stack && { details: error.stack }),
        },
        { status: 500 }
      );
    }
  }

  // Generic error response
  return NextResponse.json(
    { success: false, error: 'Une erreur est survenue' },
    { status: 500 }
  );
}

/**
 * Async route wrapper that catches errors
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>,
  context?: string
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error) => apiError(error, context));
}

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(
  request: Request,
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: ZodError } }
): Promise<T> {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    throw Errors.validation('Données invalides', result.error?.issues || []);
  }

  return result.data!;
}

/**
 * Validate URL search parameters against a Zod schema
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: ZodError } }
): T {
  const params: Record<string, string | undefined> = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  const result = schema.safeParse(params);

  if (!result.success) {
    throw Errors.validation('Paramètres de recherche invalides', result.error?.issues || []);
  }

  return result.data!;
}
