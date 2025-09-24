import '../exceptions/app_exceptions.dart';

/// Database transaction utilities for ensuring data consistency
class TransactionUtils {
  /// Executes a database operation with retry logic
  static Future<T> executeWithRetry<T>(
    Future<T> Function() operation, {
    int maxRetries = 3,
    Duration delay = const Duration(milliseconds: 500),
  }) async {
    Exception? lastException;

    for (int attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (e) {
        lastException = ExceptionHelper.from(e);

        if (attempt == maxRetries) {
          break;
        }

        // Exponential backoff
        await Future.delayed(delay * attempt);
      }
    }

    throw lastException ?? DatabaseException('Operation failed after $maxRetries attempts');
  }

  /// Executes multiple operations in a transaction-like manner
  static Future<void> executeInTransaction(
    List<Future<void> Function()> operations, {
    int maxRetries = 3,
  }) async {
    await executeWithRetry(() async {
      final results = await Future.wait(
        operations.map((op) => op()),
        eagerError: true,
      );

      if (results.any((result) => result is Exception)) {
        throw DatabaseException('Transaction failed: one or more operations failed');
      }
    }, maxRetries: maxRetries);
  }

  /// Validates database constraints before operations
  static Future<void> validateConstraints(Map<String, dynamic> data, String tableName) async {
    // Add table-specific validation
    switch (tableName) {
      case 'health_assistant_conversations':
        if (data['user_id'] == null || data['user_id'].toString().isEmpty) {
          throw ValidationException('User ID is required', 'user_id');
        }
        if (data['query'] == null || data['query'].toString().length > 1000) {
          throw ValidationException('Query is required and must be less than 1000 characters', 'query');
        }
        break;

      case 'reviews':
        if (data['rating'] != null && (data['rating'] < 1 || data['rating'] > 5)) {
          throw ValidationException('Rating must be between 1 and 5', 'rating');
        }
        break;

      case 'reservations':
        if (data['status'] != null && !['pending', 'confirmed', 'cancelled', 'completed'].contains(data['status'])) {
          throw ValidationException('Invalid reservation status', 'status');
        }
        break;
    }
  }

  /// Handles unique constraint violations
  static Future<T> handleUniqueConstraint<T>(
    Future<T> Function() operation,
    String constraintName,
  ) async {
    try {
      return await operation();
    } catch (e) {
      if (e.toString().contains('unique constraint') ||
          e.toString().contains('duplicate key')) {
        throw ConstraintException('Record already exists', constraintName);
      }
      rethrow;
    }
  }

  /// Handles foreign key constraint violations
  static Future<T> handleForeignKeyConstraint<T>(
    Future<T> Function() operation,
    String constraintName,
  ) async {
    try {
      return await operation();
    } catch (e) {
      if (e.toString().contains('foreign key constraint') ||
          e.toString().contains('foreign_key_violation')) {
        throw ConstraintException('Referenced record does not exist', constraintName);
      }
      rethrow;
    }
  }
}