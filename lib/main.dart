// Main entry point for the pharmacy management application
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:pharmaci/core/config/env.dart';
import 'package:pharmaci/core/app/app.dart';
import 'package:pharmaci/core/localization/app_localizations.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize localization
  await AppLocalizations.initialize();

  if (Env.supabaseUrl == 'CHANGE_ME' || Env.supabaseAnonKey == 'CHANGE_ME') {
    // Warn in debug logs; app will try to run but Supabase calls will fail.
    // ignore: avoid_print
    print('[Env] Configure Supabase credentials in lib/core/config/env.dart');
  }

  await Supabase.initialize(
    url: Env.supabaseUrl,
    anonKey: Env.supabaseAnonKey,
  );

  runApp(
    EasyLocalization(
      supportedLocales: AppLocalizations.supportedLocales,
      fallbackLocale: AppLocalizations.fallbackLocale,
      path: AppLocalizations.assetPath,
      child: const PharmaCiApp(),
    ),
  );
}
