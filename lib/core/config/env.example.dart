/// Copy this file to `env.dart` and fill with your secrets.
/// Do NOT commit the real `env.dart` (it is gitignored).

class Env {
  static const String supabaseUrl = 'https://YOUR-PROJECT.supabase.co';
  static const String supabaseAnonKey = 'YOUR-ANON-KEY';

  // Optional: demo pharmacy id for reservations management screen
  static const String demoPharmacyId = 'YOUR-PHARMACY-ID';

  // Z.ai API Configuration for Health Assistant
  // Run with: flutter run --dart-define=ZAI_API_KEY=your_actual_key_here
  static const String zaiApiKey = String.fromEnvironment('ZAI_API_KEY', defaultValue: '');
  static const String zaiApiUrl = 'https://api.z.ai/api/anthropic';
}

