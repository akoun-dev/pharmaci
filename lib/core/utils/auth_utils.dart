import 'package:supabase_flutter/supabase_flutter.dart';

class AuthUtils {
  static const String resetPasswordRedirect = 'io.supabase.pharmaci://reset-callback/';
  static const String authCallbackRedirect = 'io.supabase.pharmaci://auth-callback/';

  static String getErrorMessage(String? error) {
    if (error == null) return 'An unknown error occurred';

    switch (error) {
      case 'Invalid login credentials':
        return 'Email ou mot de passe incorrect';
      case 'Email not confirmed':
        return 'Veuillez confirmer votre adresse email';
      case 'User already registered':
        return 'Cet email est déjà enregistré';
      case 'Password should be at least 6 characters':
        return 'Le mot de passe doit contenir au moins 6 caractères';
      case 'Invalid email':
        return 'Adresse email invalide';
      default:
        return error;
    }
  }

  static Future<void> handleAuthCallback(Uri uri) async {
    final supabase = Supabase.instance.client;

    if (uri.path.contains('/reset-callback')) {
      await supabase.auth.getSessionFromUrl(uri);
    } else if (uri.path.contains('/auth-callback')) {
      await supabase.auth.getSessionFromUrl(uri);
    }
  }

  static bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }

  static bool isValidPassword(String password) {
    return password.length >= 6;
  }

  static bool isValidPhone(String phone) {
    return RegExp(r'^\+?[0-9]{10,15}$').hasMatch(phone);
  }

  static String maskEmail(String email) {
    final parts = email.split('@');
    if (parts.length != 2) return email;

    final name = parts[0];
    final domain = parts[1];

    if (name.length <= 2) return email;

    final maskedName = '${name[0]}${'*' * (name.length - 2)}${name[name.length - 1]}';
    return '$maskedName@$domain';
  }
}