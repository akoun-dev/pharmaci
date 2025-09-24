import 'package:flutter/material.dart';

class AppSpacing {
  // Base spacing unit
  static const double base = 4.0;

  // Micro spacing
  static const double micro = base * 0.5; // 2.0
  static const double xMicro = base; // 4.0

  // Small spacing
  static const double small = base * 2; // 8.0
  static const double xSmall = base * 3; // 12.0

  // Medium spacing
  static const double medium = base * 4; // 16.0
  static const double xMedium = base * 5; // 20.0

  // Large spacing
  static const double large = base * 6; // 24.0
  static const double xLarge = base * 8; // 32.0
  static const double xxLarge = base * 10; // 40.0
  static const double xxxLarge = base * 12; // 48.0

  // Extra large spacing
  static const double extraLarge = base * 16; // 64.0
  static const double xExtraLarge = base * 20; // 80.0
  static const double xxExtraLarge = base * 24; // 96.0

  // Edge Insets
  static const EdgeInsets allMicro = EdgeInsets.all(micro);
  static const EdgeInsets allXMicro = EdgeInsets.all(xMicro);
  static const EdgeInsets allSmall = EdgeInsets.all(small);
  static const EdgeInsets allXSmall = EdgeInsets.all(xSmall);
  static const EdgeInsets allMedium = EdgeInsets.all(medium);
  static const EdgeInsets allXMedium = EdgeInsets.all(xMedium);
  static const EdgeInsets allLarge = EdgeInsets.all(large);
  static const EdgeInsets allXLarge = EdgeInsets.all(xLarge);
  static const EdgeInsets allXXLarge = EdgeInsets.all(xxLarge);
  static const EdgeInsets allXXXLarge = EdgeInsets.all(xxxLarge);

  // Symmetric padding
  static const EdgeInsets horizontalMedium = EdgeInsets.symmetric(horizontal: medium);
  static const EdgeInsets horizontalLarge = EdgeInsets.symmetric(horizontal: large);
  static const EdgeInsets horizontalXLarge = EdgeInsets.symmetric(horizontal: xLarge);
  static const EdgeInsets verticalMedium = EdgeInsets.symmetric(vertical: medium);
  static const EdgeInsets verticalLarge = EdgeInsets.symmetric(vertical: large);
  static const EdgeInsets verticalXLarge = EdgeInsets.symmetric(vertical: xLarge);

  // Specific padding
  static const EdgeInsets screenPadding = EdgeInsets.all(medium);
  static const EdgeInsets cardPadding = EdgeInsets.all(medium);
  static const EdgeInsets buttonPadding = EdgeInsets.symmetric(horizontal: xMedium, vertical: small);
  static const EdgeInsets inputPadding = EdgeInsets.symmetric(horizontal: medium, vertical: small);
  static const EdgeInsets listTilePadding = EdgeInsets.symmetric(horizontal: medium, vertical: xSmall);

  // Border radius
  static const double radiusSmall = 4.0;
  static const double radiusMedium = 8.0;
  static const double radiusLarge = 12.0;
  static const double radiusXLarge = 16.0;
  static const double radiusXXLarge = 20.0;
  static const double radiusCircular = 24.0;

  static const BorderRadius borderRadiusSmall = BorderRadius.all(Radius.circular(radiusSmall));
  static const BorderRadius borderRadiusMedium = BorderRadius.all(Radius.circular(radiusMedium));
  static const BorderRadius borderRadiusLarge = BorderRadius.all(Radius.circular(radiusLarge));
  static const BorderRadius borderRadiusXLarge = BorderRadius.all(Radius.circular(radiusXLarge));
  static const BorderRadius borderRadiusXXLarge = BorderRadius.all(Radius.circular(radiusXXLarge));
  static const BorderRadius borderRadiusCircular = BorderRadius.all(Radius.circular(radiusCircular));

  // Card specific spacing
  static const EdgeInsets cardContentPadding = EdgeInsets.all(medium);
  static const EdgeInsets cardHeaderPadding = EdgeInsets.symmetric(horizontal: medium, vertical: small);
  static const EdgeInsets cardFooterPadding = EdgeInsets.all(medium);

  // List spacing
  static const double listItemSpacing = 8.0;
  static const double sectionSpacing = 16.0;
  static const double pageSpacing = 24.0;

  // Button spacing
  static const double buttonHeight = 48.0;
  static const double smallButtonHeight = 36.0;
  static const double largeButtonHeight = 56.0;
  static const double iconButtonSize = 48.0;
  static const double smallIconButtonSize = 36.0;

  // Map specific spacing
  static const double mapMarkerSize = 40.0;
  static const double mapPadding = 16.0;
  static const double mapControlSpacing = 8.0;
}