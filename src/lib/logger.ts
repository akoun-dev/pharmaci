/**
 * Conditional logger that only logs in development environment.
 * Use this instead of console.log/error/warn/info to prevent
 * information leakage in production.
 */
type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Development-only logger. In production, all methods are no-ops.
 */
export const logger: Logger = isDevelopment
  ? {
      log: (...args: unknown[]) => console.log(...args),
      error: (...args: unknown[]) => console.error(...args),
      warn: (...args: unknown[]) => console.warn(...args),
      info: (...args: unknown[]) => console.info(...args),
      debug: (...args: unknown[]) => console.debug(...args),
    }
  : {
      log: () => {},
      error: () => {}, // Consider using a proper logging service in production
      warn: () => {},
      info: () => {},
      debug: () => {},
    };

/**
 * Log API errors - always logs errors even in production
 * but with sanitized messages
 */
export function logApiError(endpoint: string, error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  if (isDevelopment) {
    logger.error(`[API Error] ${endpoint}:`, message, error, context);
  } else {
    // In production, log minimal info - consider using a proper logging service
    logger.error(`[API Error] ${endpoint}: ${message}`);
  }
}
