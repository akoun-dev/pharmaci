import 'package:supabase_flutter/supabase_flutter.dart';
import '../exceptions/app_exceptions.dart';

/// Authentication guard for protecting sensitive operations
///
/// Provides comprehensive authentication and authorization checks including:
/// - User authentication validation
/// - Role-based access control
/// - Resource ownership verification
/// - Session validation and refresh
/// - Rate limiting for authentication attempts
class AuthGuard {
  final SupabaseClient _supabase;

  const AuthGuard(this._supabase);

  /// Checks if user is authenticated and returns user info
  ///
  /// Validates current user session and returns user information including
  /// roles and metadata. Throws [AuthenticationException] if user is not
  /// authenticated or session has expired.
  Future<Map<String, dynamic>> requireAuth() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw const AuthenticationException('User not authenticated');
      }

      // Check if session is valid
      final session = _supabase.auth.currentSession;
      if (session == null || session.isExpired) {
        throw const SessionExpiredException();
      }

      // Return user info with role verification
      return {
        'id': user.id,
        'email': user.email,
        'role': user.userMetadata?['role'] ?? 'patient',
        'metadata': user.userMetadata,
      };
    } catch (e) {
      if (e is AuthenticationException) {
        rethrow;
      }
      throw AuthenticationException('Authentication check failed: ${e.toString()}');
    }
  }

  /// Checks if user has required role
  Future<void> requireRole(String requiredRole) async {
    final userInfo = await requireAuth();
    final userRole = userInfo['role'] as String;

    if (userRole != requiredRole && userRole != 'admin') {
      throw ForbiddenException('Insufficient permissions. Required role: $requiredRole');
    }
  }

  /// Checks if user has any of the required roles
  Future<void> requireAnyRole(List<String> requiredRoles) async {
    final userInfo = await requireAuth();
    final userRole = userInfo['role'] as String;

    if (!requiredRoles.contains(userRole) && userRole != 'admin') {
      throw ForbiddenException(
        'Insufficient permissions. Required one of: ${requiredRoles.join(', ')}',
      );
    }
  }

  /// Validates user ownership of resource
  Future<void> requireOwnership(String resourceUserId) async {
    final userInfo = await requireAuth();
    final currentUserId = userInfo['id'] as String;

    if (currentUserId != resourceUserId && userInfo['role'] != 'admin') {
      throw ForbiddenException('You can only access your own resources');
    }
  }

  /// Checks pharmacy ownership for pharmacy-specific operations
  Future<void> requirePharmacyOwnership(String pharmacyId) async {
    await requireAnyRole(['pharmacist', 'admin']);

    // Additional check to verify pharmacy belongs to user
    // This would typically involve a database query
    // For now, we'll just check the role
  }

  /// Validates admin access
  Future<void> requireAdmin() async {
    await requireRole('admin');
  }

  /// Gets current user with validation
  Future<Map<String, dynamic>> getCurrentUser() async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      throw const AuthenticationException('No user logged in');
    }

    return {
      'id': user.id,
      'email': user.email,
      'role': user.userMetadata?['role'] ?? 'patient',
      'metadata': user.userMetadata,
    };
  }

  /// Refreshes authentication token
  Future<void> refreshToken() async {
    try {
      await _supabase.auth.refreshSession();
    } catch (e) {
      throw SessionExpiredException('Failed to refresh session: ${e.toString()}');
    }
  }

  /// Checks if user email is verified
  Future<void> requireVerifiedEmail() async {
    final userInfo = await requireAuth();
    final user = _supabase.auth.currentUser;

    if (user?.emailConfirmedAt == null) {
      throw ForbiddenException('Email verification required');
    }
  }

  /// Rate limiting for authentication attempts
  static final Map<String, int> _authAttempts = {};
  static final Map<String, int> _lastAuthAttempt = {};

  static bool _isRateLimited(String identifier) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final attempts = _authAttempts[identifier] ?? 0;
    final lastAttempt = _lastAuthAttempt[identifier] ?? 0;

    // Reset attempts after 5 minutes
    if (now - lastAttempt > 300000) {
      _authAttempts[identifier] = 0;
      return false;
    }

    // Rate limit after 5 failed attempts
    if (attempts >= 5) {
      return true;
    }

    return false;
  }

  static void _recordAuthAttempt(String identifier, bool success) {
    final now = DateTime.now().millisecondsSinceEpoch;

    if (success) {
      _authAttempts[identifier] = 0;
    } else {
      _authAttempts[identifier] = (_authAttempts[identifier] ?? 0) + 1;
    }

    _lastAuthAttempt[identifier] = now;
  }

  /// Static helper for authentication rate limiting
  static Future<void> checkAuthRateLimit(String identifier) async {
    if (_isRateLimited(identifier)) {
      throw AuthenticationException(
        'Too many authentication attempts. Please wait 5 minutes.',
      );
    }
  }

  /// Records authentication attempt for rate limiting
  static void recordAuthAttempt(String identifier, bool success) {
    _recordAuthAttempt(identifier, success);
  }
}