/// Custom exceptions for input validation
///
/// This class provides a structured way to handle validation errors
/// with optional field specification for better error reporting.
class AppValidationException implements Exception {
  final String message;
  final String? field;

  const AppValidationException(this.message, [this.field]);

  @override
  String toString() => 'ValidationException: $message${field != null ? ' (field: $field)' : ''}';
}

class InvalidInputException extends AppValidationException {
  const InvalidInputException(String message, [String? field]) : super(message, field);
}

class EmptyInputException extends AppValidationException {
  const EmptyInputException([String? field]) : super('Input cannot be empty', field);
}

class TooLongInputException extends AppValidationException {
  const TooLongInputException(int maxLength, [String? field])
      : super('Input exceeds maximum length of $maxLength characters', field);
}

class InvalidCharacterException extends AppValidationException {
  const InvalidCharacterException(String message, [String? field]) : super(message, field);
}

/// Input validator for health assistant queries
///
/// This class provides comprehensive validation for health assistant inputs
/// including SQL injection prevention, XSS protection, and content filtering.
/// It ensures user inputs are safe before processing by the AI API.
class HealthAssistantValidator {
  static const int _maxQueryLength = 1000;
  static const int _minQueryLength = 3;

  /// Validates a health assistant query
  ///
  /// Performs comprehensive validation including:
  /// - Empty input check
  /// - Length validation (3-1000 characters)
  /// - XSS and script injection prevention
  /// - SQL injection pattern detection
  ///
  /// Throws [AppValidationException] if validation fails
  static void validateQuery(String query) {
    if (query.trim().isEmpty) {
      throw const EmptyInputException('query');
    }

    if (query.length < _minQueryLength) {
      throw InvalidInputException('Query must be at least $_minQueryLength characters long', 'query');
    }

    if (query.length > _maxQueryLength) {
      throw TooLongInputException(_maxQueryLength, 'query');
    }

    // Check for potentially harmful content
    if (_containsSuspiciousContent(query)) {
      throw const InvalidCharacterException('Query contains potentially harmful content', 'query');
    }

    // Basic SQL injection prevention
    if (_containsSqlInjectionPatterns(query)) {
      throw const InvalidCharacterException('Query contains invalid characters or patterns', 'query');
    }
  }

  /// Validates user ID format
  ///
  /// Ensures the user ID is not empty and meets minimum length requirements.
  /// This prevents invalid database queries and ensures proper access control.
  static void validateUserId(String userId) {
    if (userId.trim().isEmpty) {
      throw const EmptyInputException('userId');
    }

    if (userId.length < 10) {
      throw InvalidInputException('Invalid user ID format', 'userId');
    }
  }

  /// Checks for suspicious content patterns
  ///
  /// Detects potential XSS, script injection, and other malicious content
  /// patterns that could compromise application security.
  static bool _containsSuspiciousContent(String input) {
    final suspiciousPatterns = [
      RegExp(r'<script[^>]*>.*?</script>', caseSensitive: false),
      RegExp(r'javascript:', caseSensitive: false),
      RegExp(r'on\w+\s*=', caseSensitive: false),
      RegExp(r'eval\s*\(', caseSensitive: false),
      RegExp(r'document\.', caseSensitive: false),
      RegExp(r'window\.', caseSensitive: false),
    ];

    return suspiciousPatterns.any((pattern) => pattern.hasMatch(input));
  }

  /// Checks for SQL injection patterns
  ///
  /// Detects common SQL injection techniques including:
  /// - UNION-based attacks
  /// - Boolean-based attacks
  /// - Comment-based attacks
  /// - Tautology-based attacks
  static bool _containsSqlInjectionPatterns(String input) {
    final sqlPatterns = [
      RegExp(r'\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b', caseSensitive: false),
      RegExp(r'(\s|^)(OR|AND)\s+\d+\s*=\s*\d+', caseSensitive: false),
      RegExp(r'(\s|^)(OR|AND)\s+\'[^\']*\'\s*=\s*\'[^\']*\'', caseSensitive: false),
      RegExp(r';\s*(DROP|DELETE|UPDATE)', caseSensitive: false),
      RegExp(r'\/\*.*\*\/', caseSensitive: false),
      RegExp(r'--\s.*$', caseSensitive: false),
    ];

    return sqlPatterns.any((pattern) => pattern.hasMatch(input));
  }
}