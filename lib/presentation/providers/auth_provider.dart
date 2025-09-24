import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:pharmaci/data/models/user/user_model.dart';
import '../../core/utils/error_handler.dart';
import '../../core/utils/logger.dart';
import '../../core/exceptions/app_exceptions.dart';

class AuthProvider with ChangeNotifier {
  final SupabaseClient _supabase = Supabase.instance.client;

  User? _user;
  UserModel? _userProfile;
  bool _isLoading = false;
  String? _error;
  AuthStatus _status = AuthStatus.unauthenticated;

  User? get user => _user;
  UserModel? get userProfile => _userProfile;
  bool get isLoading => _isLoading;
  String? get error => _error;
  AuthStatus get status => _status;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _initAuth();
  }

  void _initAuth() {
    _supabase.auth.onAuthStateChange.listen((data) {
      _user = data.session?.user;
      if (_user != null) {
        _fetchUserProfile();
      } else {
        _userProfile = null;
        _status = AuthStatus.unauthenticated;
      }
      notifyListeners();
    });
  }

  Future<void> _fetchUserProfile() async {
    if (_user == null) return;

    try {
      _isLoading = true;
      notifyListeners();

      final response = await _supabase
          .from('users')
          .select()
          .eq('id', _user!.id)
          .single();

      _userProfile = UserModel.fromJson(response);
      _status = AuthStatus.authenticated;

      await SecureLogger.instance.info('User profile fetched successfully',
        context: {'user_id': _user!.id},
        screen: 'AuthProvider',
      );
    } catch (e, stackTrace) {
      final exception = ExceptionHelper.from(e);
      _error = ExceptionHelper.getUserMessage(exception);
      _status = AuthStatus.error;

      await ErrorHandler.instance.handleError(
        exception,
        stackTrace: stackTrace,
        screen: 'AuthProvider',
        action: 'fetchUserProfile',
        context: {'user_id': _user?.id},
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await SecureLogger.instance.info('Sign in attempt',
        context: {'email': email},
        screen: 'AuthProvider',
      );

      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user != null) {
        await _fetchUserProfile();
        await SecureLogger.instance.info('Sign in successful',
          context: {'user_id': response.user!.id},
          screen: 'AuthProvider',
        );
        return true;
      }

      await SecureLogger.instance.warning('Sign in failed - no user returned',
        screen: 'AuthProvider',
      );
      return false;
    } on AuthException catch (e) {
      final exception = AuthenticationException(e.message, 'AUTH_${e.statusCode}');
      _error = ExceptionHelper.getUserMessage(exception);

      await ErrorHandler.instance.handleError(
        exception,
        screen: 'AuthProvider',
        action: 'signIn',
        context: {'email': email, 'auth_error': e.message},
      );
      return false;
    } catch (e, stackTrace) {
      final exception = ExceptionHelper.from(e);
      _error = ExceptionHelper.getUserMessage(exception);

      await ErrorHandler.instance.handleError(
        exception,
        stackTrace: stackTrace,
        screen: 'AuthProvider',
        action: 'signIn',
        context: {'email': email},
      );
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    String role = 'patient',
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await SecureLogger.instance.info('Sign up attempt',
        context: {'email': email, 'role': role},
        screen: 'AuthProvider',
      );

      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {
          'first_name': firstName,
          'last_name': lastName,
          'phone': phone,
          'role': role,
        },
      );

      if (response.user != null) {
        // Create user profile
        await _supabase.from('users').insert({
          'id': response.user!.id,
          'email': email,
          'first_name': firstName,
          'last_name': lastName,
          'phone': phone,
          'role': role,
        });

        await SecureLogger.instance.info('Sign up successful',
          context: {'user_id': response.user!.id, 'role': role},
          screen: 'AuthProvider',
        );
        return true;
      }

      await SecureLogger.instance.warning('Sign up failed - no user returned',
        screen: 'AuthProvider',
      );
      return false;
    } on AuthException catch (e) {
      final exception = AuthenticationException(e.message, 'SIGNUP_${e.statusCode}');
      _error = ExceptionHelper.getUserMessage(exception);

      await ErrorHandler.instance.handleError(
        exception,
        screen: 'AuthProvider',
        action: 'signUp',
        context: {'email': email, 'role': role, 'auth_error': e.message},
      );
      return false;
    } catch (e, stackTrace) {
      final exception = ExceptionHelper.from(e);
      _error = ExceptionHelper.getUserMessage(exception);

      await ErrorHandler.instance.handleError(
        exception,
        stackTrace: stackTrace,
        screen: 'AuthProvider',
        action: 'signUp',
        context: {'email': email, 'role': role},
      );
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> resetPassword(String email) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await _supabase.auth.resetPasswordForEmail(
        email,
        redirectTo: 'io.supabase.pharmaci://reset-callback/',
      );
      return true;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Verify current password by attempting to sign in
      final email = _user?.email;
      if (email == null) {
        _error = 'No authenticated user';
        return false;
      }

      await _supabase.auth.signInWithPassword(
        email: email,
        password: currentPassword,
      );

      // Update password
      await _supabase.auth.updateUser(
        UserAttributes(password: newPassword),
      );
      return true;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signInWithMagicLink(String email) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await _supabase.auth.signInWithOtp(
        email: email,
        emailRedirectTo: 'io.supabase.pharmaci://auth-callback/',
      );
      return true;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    try {
      await SecureLogger.instance.info('Sign out attempt',
        context: {'user_id': _user?.id},
        screen: 'AuthProvider',
      );

      await _supabase.auth.signOut();
      _user = null;
      _userProfile = null;
      _status = AuthStatus.unauthenticated;

      await SecureLogger.instance.info('Sign out successful',
        screen: 'AuthProvider',
      );

      notifyListeners();
    } catch (e, stackTrace) {
      final exception = ExceptionHelper.from(e);
      _error = ExceptionHelper.getUserMessage(exception);

      await ErrorHandler.instance.handleError(
        exception,
        stackTrace: stackTrace,
        screen: 'AuthProvider',
        action: 'signOut',
        context: {'user_id': _user?.id},
      );

      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<bool> updateUserProfile({
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    if (_user == null) return false;

    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final updates = <String, dynamic>{};
      if (firstName != null) updates['first_name'] = firstName;
      if (lastName != null) updates['last_name'] = lastName;
      if (phone != null) updates['phone'] = phone;

      await _supabase
          .from('users')
          .update(updates)
          .eq('id', _user!.id);

      await _fetchUserProfile();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

enum AuthStatus {
  authenticated,
  unauthenticated,
  loading,
  error,
}
