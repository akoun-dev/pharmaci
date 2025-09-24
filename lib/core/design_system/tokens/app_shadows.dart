import 'package:flutter/material.dart';

class AppShadows {
  // Shadow elevations
  static const List<BoxShadow> none = [];

  static const List<BoxShadow> small = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
  ];

  static const List<BoxShadow> medium = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> large = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> xLarge = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 16,
      offset: Offset(0, 8),
    ),
  ];

  static const List<BoxShadow> xxLarge = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 24,
      offset: Offset(0, 12),
    ),
  ];

  // Colored shadows
  static const List<BoxShadow> primaryShadow = [
    BoxShadow(
      color: Color(0x33FF6B35),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> secondaryShadow = [
    BoxShadow(
      color: Color(0x3300C853),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> errorShadow = [
    BoxShadow(
      color: Color(0x33D32F2F),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];

  // Card shadows
  static const List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Color(0x0F000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
    BoxShadow(
      color: Color(0x0A000000),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> cardSelectedShadow = [
    BoxShadow(
      color: Color(0x33FF6B35),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];

  // Button shadows
  static const List<BoxShadow> buttonShadow = [
    BoxShadow(
      color: Color(0x33000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> buttonPressedShadow = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
  ];

  // Map marker shadows
  static const List<BoxShadow> mapMarkerShadow = [
    BoxShadow(
      color: Color(0x33000000),
      blurRadius: 6,
      offset: Offset(0, 3),
    ),
  ];

  static const List<BoxShadow> mapMarkerSelectedShadow = [
    BoxShadow(
      color: Color(0x4DFF6B35),
      blurRadius: 12,
      offset: Offset(0, 6),
    ),
  ];

  // Custom shadow factory
  static List<BoxShadow> custom({
    Color color = const Color(0x33000000),
    double blurRadius = 4,
    double spreadRadius = 0,
    Offset offset = Offset.zero,
  }) {
    return [
      BoxShadow(
        color: color,
        blurRadius: blurRadius,
        spreadRadius: spreadRadius,
        offset: offset,
      ),
    ];
  }

  // Dynamic shadow based on elevation
  static List<BoxShadow> elevation(double elevation) {
    if (elevation <= 0) return none;
    if (elevation <= 1) return small;
    if (elevation <= 2) return medium;
    if (elevation <= 4) return large;
    if (elevation <= 8) return xLarge;
    return xxLarge;
  }
}