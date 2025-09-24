/// Custom application exceptions for better error handling
library app_exceptions;

/// Base exception class for all application errors
abstract class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  const AppException(this.message, [this.code, this.originalError]);

  @override
  String toString() => '${runtimeType.toString()}: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Network-related exceptions
class NetworkException extends AppException {
  const NetworkException(String message, [String? code, dynamic originalError])
      : super(message, code ?? 'NETWORK_ERROR', originalError);
}

class TimeoutException extends NetworkException {
  const TimeoutException([String message = 'Request timeout'])
      : super(message, 'TIMEOUT_ERROR');
}

class ConnectionException extends NetworkException {
  const ConnectionException([String message = 'No internet connection'])
      : super(message, 'CONNECTION_ERROR');
}

/// API-related exceptions
class ApiException extends AppException {
  final int? statusCode;
  final Map<String, dynamic>? response;

  const ApiException(
    String message, {
    this.statusCode,
    this.response,
    String? code,
    dynamic originalError,
  }) : super(message, code ?? 'API_ERROR', originalError);
}

class UnauthorizedException extends ApiException {
  const UnauthorizedException([String message = 'Unauthorized access'])
      : super(message, statusCode: 401, code: 'UNAUTHORIZED');
}

class ForbiddenException extends ApiException {
  const ForbiddenException([String message = 'Access forbidden'])
      : super(message, statusCode: 403, code: 'FORBIDDEN');
}

class NotFoundException extends ApiException {
  const NotFoundException([String message = 'Resource not found'])
      : super(message, statusCode: 404, code: 'NOT_FOUND');
}

class RateLimitExceededException extends ApiException {
  final int retryAfter;

  const RateLimitExceededException(
    String message, {
    this.retryAfter = 0,
  }) : super(message, statusCode: 429, code: 'RATE_LIMIT_EXCEEDED');
}

class ServerErrorException extends ApiException {
  const ServerException([String message = 'Internal server error'])
      : super(message, statusCode: 500, code: 'SERVER_ERROR');
}

/// Database exceptions
class DatabaseException extends AppException {
  const DatabaseException(String message, [String? code, dynamic originalError])
      : super(message, code ?? 'DATABASE_ERROR', originalError);
}

class ValidationException extends DatabaseException {
  const ValidationException(String message, [String? field])
      : super(message, field != null ? 'VALIDATION_$field' : 'VALIDATION_ERROR');
}

class ConstraintException extends DatabaseException {
  const ConstraintException(String message, [String? constraint])
      : super(message, constraint != null ? 'CONSTRAINT_$constraint' : 'CONSTRAINT_ERROR');
}

class TimeoutDatabaseException extends DatabaseException {
  const TimeoutDatabaseException([String message = 'Database operation timeout'])
      : super(message, 'DB_TIMEOUT_ERROR');
}

/// Authentication exceptions
class AuthenticationException extends AppException {
  const AuthenticationException(String message, [String? code])
      : super(message, code ?? 'AUTH_ERROR');
}

class InvalidCredentialsException extends AuthenticationException {
  const InvalidCredentialsException([String message = 'Invalid credentials'])
      : super(message, 'INVALID_CREDENTIALS');
}

class SessionExpiredException extends AuthenticationException {
  const SessionExpiredException([String message = 'Session expired'])
      : super(message, 'SESSION_EXPIRED');
}

class AccountLockedException extends AuthenticationException {
  const AccountLockedException([String message = 'Account is locked'])
      : super(message, 'ACCOUNT_LOCKED');
}

/// Business logic exceptions
class BusinessException extends AppException {
  const BusinessException(String message, [String? code])
      : super(message, code ?? 'BUSINESS_ERROR');
}

class InsufficientFundsException extends BusinessException {
  const InsufficientFundsException([String message = 'Insufficient funds'])
      : super(message, 'INSUFFICIENT_FUNDS');
}

class InvalidStateException extends BusinessException {
  const InvalidStateException(String message, [String? state])
      : super(message, state != null ? 'INVALID_STATE_$state' : 'INVALID_STATE');
}

class ResourceUnavailableException extends BusinessException {
  const ResourceUnavailableException(String message, [String? resource])
      : super(message, resource != null ? 'UNAVAILABLE_$resource' : 'RESOURCE_UNAVAILABLE');
}

/// Configuration exceptions
class ConfigurationException extends AppException {
  const ConfigurationException(String message, [String? setting])
      : super(message, setting != null ? 'CONFIG_$setting' : 'CONFIG_ERROR');
}

class MissingConfigurationException extends ConfigurationException {
  const MissingConfigurationException(String setting)
      : super('Missing configuration: $setting', setting);
}

class InvalidConfigurationException extends ConfigurationException {
  const InvalidConfigurationException(String setting, String message)
      : super('Invalid configuration $setting: $message', setting);
}

/// Helper functions for exception handling
class ExceptionHelper {
  /// Converts any exception to a user-friendly AppException
  static AppException from(dynamic error) {
    if (error is AppException) {
      return error;
    }

    if (error is FormatException) {
      return ValidationException('Invalid data format: ${error.message}');
    }

    if (error is TypeError) {
      return ValidationException('Type error: ${error.toString()}');
    }

    if (error.toString().contains('SocketException')) {
      return const ConnectionException();
    }

    if (error.toString().contains('TimeoutException')) {
      return const TimeoutException();
    }

    if (error.toString().contains('Unauthorized') || error.toString().contains('401')) {
      return const UnauthorizedException();
    }

    if (error.toString().contains('Forbidden') || error.toString().contains('403')) {
      return const ForbiddenException();
    }

    if (error.toString().contains('NotFound') || error.toString().contains('404')) {
      return const NotFoundException();
    }

    if (error.toString().contains('Rate limit') || error.toString().contains('429')) {
      return const RateLimitExceededException('Rate limit exceeded');
    }

    if (error.toString().contains('Server') || error.toString().contains('500')) {
      return const ServerErrorException();
    }

    // Fallback to generic exception
    return AppException(
      error.toString(),
      'UNKNOWN_ERROR',
      error,
    );
  }

  /// Gets user-friendly message from exception
  static String getUserMessage(AppException exception) {
    return switch (exception.runtimeType.toString()) {
      'NetworkException' => 'Problème de connexion. Vérifiez votre internet.',
      'TimeoutException' => 'Le serveur met trop temps à répondre. Veuillez réessayer.',
      'ConnectionException' => 'Aucune connexion internet détectée.',
      'UnauthorizedException' => 'Accès non autorisé. Veuillez vous reconnecter.',
      'ForbiddenException' => 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
      'NotFoundException' => 'Ressource non trouvée.',
      'RateLimitExceededException' => 'Trop de demandes. Veuillez attendre avant de réessayer.',
      'ServerErrorException' => 'Erreur serveur. Veuillez réessayer plus tard.',
      'ValidationException' => exception.message,
      'AuthenticationException' => exception.message,
      'BusinessException' => exception.message,
      'ConfigurationException' => 'Erreur de configuration. Veuillez contacter le support.',
      _ => 'Une erreur est survenue. Veuillez réessayer.',
    };
  }
}