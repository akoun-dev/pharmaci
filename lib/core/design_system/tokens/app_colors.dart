import 'package:flutter/material.dart';

class AppColors {
  // === Couleurs principales - Identité PharmaCi ===
  static const Color primary = Color(0xFFF77F00); // Orange CI
  static const Color primaryVariant = Color(0xFFE56B00);

  static const Color secondary = Color(0xFF009739); // Vert CI / santé
  static const Color secondaryVariant = Color(0xFF007F2E);

  static const Color background = Color(0xFFFFFFFF); // Blanc pur
  static const Color surface = Color(0xFFF4F4F4);    // Gris clair
  static const Color error = Color(0xFFD32F2F);

  // Couleurs de contraste (textes sur fonds colorés)
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color onBackground = Color(0xFF1A3C5A); // Bleu foncé (texte principal)
  static const Color onSurface = Color(0xFF212121);
  static const Color onError = Color(0xFFFFFFFF);

  // === Couleurs sémantiques ===
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFF9800);
  static const Color info = Color(0xFF2196F3);
  static const Color emergency = Color(0xFFE91E63); // Fonctionnalités d’urgence

  // === Couleurs de texte ===
  static const Color textPrimary = Color(0xFF1A3C5A); // Bleu foncé
  static const Color textSecondary = Color(0xFF757575);
  static const Color textDisabled = Color(0xFFBDBDBD);

  // === Statuts pharmacie ===
  static const Color open = Color(0xFF009739);    // Ouverte
  static const Color closed = Color(0xFF9E9E9E);  // Fermée
  static const Color limited = Color(0xFFFF9800); // Stock limité
  static const Color available = Color(0xFF009739); // Médicament dispo

  // === Dégradés ===
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFF77F00), Color(0xFFFFA040)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient emergencyGradient = LinearGradient(
    colors: [Color(0xFFE91E63), Color(0xFFAD1457)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // === Couleurs de carte ===
  static const Color mapMarkerPharmacy = Color(0xFFF77F00); // Orange
  static const Color mapMarkerCurrent = Color(0xFF2196F3);  // Position utilisateur
  static const Color mapMarkerSelected = Color(0xFF009739); // Sélectionné

  static final Color mapRadiusFill = const Color(0xFFF77F00).withOpacity(0.2);
  static final Color mapRadiusStroke = const Color(0xFFF77F00).withOpacity(0.6);
}
