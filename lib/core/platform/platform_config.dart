import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'platform_utils.dart';

/// Platform-specific configuration for the app
class PlatformConfig {
  /// Get platform-specific theme data
  static ThemeData getMaterialThemeData(ColorScheme colorScheme) {
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      appBarTheme: AppBarTheme(
        elevation: PlatformUtils.appBarElevation,
        centerTitle: PlatformUtils.isIOS,
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
          ),
          elevation: 2,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: PlatformUtils.isIOS ? 1 : 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: PlatformUtils.inputBorder,
        enabledBorder: PlatformUtils.inputBorder,
        focusedBorder: PlatformUtils.inputBorder.copyWith(
          borderSide: BorderSide(color: colorScheme.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      pageTransitionsTheme: PageTransitionsTheme(
        builders: {
          TargetPlatform.android: const FadeUpwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: const CupertinoPageTransitionsBuilder(),
          TargetPlatform.windows: const FadeUpwardsPageTransitionsBuilder(),
          TargetPlatform.linux: const FadeUpwardsPageTransitionsBuilder(),
          TargetPlatform.macOS: const CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }

  /// Get Cupertino theme data
  static CupertinoThemeData getCupertinoThemeData(ColorScheme colorScheme) {
    return CupertinoThemeData(
      primaryColor: colorScheme.primary,
      barBackgroundColor: CupertinoColors.systemBackground,
      scaffoldBackgroundColor: CupertinoColors.systemBackground,
    );
  }

  /// Get platform-specific page transition
  static Widget buildPageTransition(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    if (PlatformUtils.isIOS) {
      return CupertinoPageTransition(
        linearTransition: false,
        primaryRouteAnimation: animation,
        secondaryRouteAnimation: secondaryAnimation,
        child: child,
      );
    }

    return FadeTransition(
      opacity: animation,
      child: child,
    );
  }

  /// Get platform-specific navigation bar theme
  static BottomNavigationBarThemeData getBottomNavigationBarThemeData(
    ColorScheme colorScheme,
  ) {
    return BottomNavigationBarThemeData(
      backgroundColor: colorScheme.surface,
      selectedItemColor: colorScheme.primary,
      unselectedItemColor: colorScheme.onSurface.withValues(alpha: 0.6),
      elevation: PlatformUtils.isIOS ? 0 : 8,
      type: BottomNavigationBarType.fixed,
      selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),
      unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal),
    );
  }

  /// Get platform-specific tab bar theme
  static TabBarTheme getTabBarThemeData(ColorScheme colorScheme) {
    return TabBarTheme(
      labelColor: colorScheme.primary,
      unselectedLabelColor: colorScheme.onSurface.withValues(alpha: 0.6),
      indicator: UnderlineTabIndicator(
        borderSide: BorderSide(color: colorScheme.primary, width: 2),
      ),
      labelStyle: const TextStyle(fontWeight: FontWeight.w600),
      unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal),
    );
  }

  /// Get platform-specific dialog theme
  static DialogTheme getDialogThemeData(ColorScheme colorScheme) {
    return DialogTheme(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
      ),
      elevation: PlatformUtils.isIOS ? 0 : 24,
      backgroundColor: colorScheme.surface,
      surfaceTintColor: colorScheme.primary,
    );
  }

  /// Get platform-specific text theme
  static TextTheme getTextTheme(ColorScheme colorScheme) {
    final baseTheme = Typography.englishLike2021;

    return baseTheme.copyWith(
      headlineLarge: baseTheme.headlineLarge?.copyWith(
        fontWeight: FontWeight.bold,
        color: colorScheme.onSurface,
      ),
      headlineMedium: baseTheme.headlineMedium?.copyWith(
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
      ),
      headlineSmall: baseTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
      ),
      titleLarge: baseTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
      ),
      titleMedium: baseTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w500,
        color: colorScheme.onSurface,
      ),
      bodyLarge: baseTheme.bodyLarge?.copyWith(
        color: colorScheme.onSurface,
      ),
      bodyMedium: baseTheme.bodyMedium?.copyWith(
        color: colorScheme.onSurface,
      ),
      bodySmall: baseTheme.bodySmall?.copyWith(
        color: colorScheme.onSurface.withValues(alpha: 0.7),
      ),
    );
  }

  /// Get platform-specific switch theme
  static SwitchThemeData getSwitchThemeData(ColorScheme colorScheme) {
    return SwitchThemeData(
      thumbColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.disabled)) {
          return colorScheme.onSurface.withValues(alpha: 0.38);
        }
        if (states.contains(MaterialState.selected)) {
          return colorScheme.primary;
        }
        return colorScheme.onSurface.withValues(alpha: 0.6);
      }),
      trackColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.disabled)) {
          return colorScheme.onSurface.withValues(alpha: 0.12);
        }
        if (states.contains(MaterialState.selected)) {
          return colorScheme.primary.withValues(alpha: 0.5);
        }
        return colorScheme.onSurface.withValues(alpha: 0.38);
      }),
    );
  }

  /// Get platform-specific checkbox theme
  static CheckboxThemeData getCheckboxThemeData(ColorScheme colorScheme) {
    return CheckboxThemeData(
      fillColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.disabled)) {
          return colorScheme.onSurface.withValues(alpha: 0.38);
        }
        if (states.contains(MaterialState.selected)) {
          return colorScheme.primary;
        }
        return colorScheme.onSurface;
      }),
      checkColor: MaterialStateProperty.all(colorScheme.onPrimary),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
      ),
    );
  }

  /// Get platform-specific slider theme
  static SliderThemeData getSliderThemeData(ColorScheme colorScheme) {
    return SliderThemeData(
      activeTrackColor: colorScheme.primary,
      inactiveTrackColor: colorScheme.onSurface.withValues(alpha: 0.12),
      thumbColor: colorScheme.primary,
      overlayColor: colorScheme.primary.withValues(alpha: 0.12),
      valueIndicatorColor: colorScheme.primary,
      valueIndicatorTextStyle: TextStyle(
        color: colorScheme.onPrimary,
      ),
      trackHeight: PlatformUtils.isIOS ? 4 : 6,
      thumbShape: PlatformUtils.isIOS
          ? const RoundSliderThumbShape(enabledThumbRadius: 12)
          : const RoundSliderThumbShape(enabledThumbRadius: 10),
      overlayShape: PlatformUtils.isIOS
          ? const RoundSliderOverlayShape(overlayRadius: 20)
          : const RoundSliderOverlayShape(overlayRadius: 16),
    );
  }

  /// Get platform-specific progress indicator theme
  static ProgressIndicatorThemeData getProgressIndicatorThemeData(
    ColorScheme colorScheme,
  ) {
    return ProgressIndicatorThemeData(
      color: colorScheme.primary,
      linearTrackHeight: PlatformUtils.isIOS ? 2 : 6,
      refreshBackgroundColor: colorScheme.surface,
    );
  }

  /// Get platform-specific divider theme
  static DividerThemeData getDividerThemeData(ColorScheme colorScheme) {
    return DividerThemeData(
      color: colorScheme.onSurface.withValues(alpha: 0.12),
      thickness: PlatformUtils.isIOS ? 0.5 : 1,
      space: PlatformUtils.isIOS ? 16 : 8,
    );
  }

  /// Get platform-specific floating action button theme
  static FloatingActionButtonThemeData getFloatingActionButtonThemeData(
    ColorScheme colorScheme,
  ) {
    return FloatingActionButtonThemeData(
      backgroundColor: colorScheme.primary,
      foregroundColor: colorScheme.onPrimary,
      elevation: PlatformUtils.isIOS ? 1 : 6,
      highlightElevation: PlatformUtils.isIOS ? 2 : 12,
      shape: PlatformUtils.isIOS
          ? const CircleBorder()
          : RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
            ),
    );
  }

  /// Get platform-specific chip theme
  static ChipThemeData getChipThemeData(ColorScheme colorScheme) {
    return ChipThemeData(
      backgroundColor: colorScheme.surface,
      deleteIconColor: colorScheme.onSurface.withValues(alpha: 0.6),
      disabledColor: colorScheme.onSurface.withValues(alpha: 0.12),
      selectedColor: colorScheme.primary.withValues(alpha: 0.12),
      secondarySelectedColor: colorScheme.primary.withValues(alpha: 0.08),
      shadowColor: Colors.black.withValues(alpha: 0.2),
      selectedShadowColor: Colors.black.withValues(alpha: 0.2),
      checkmarkColor: colorScheme.primary,
      labelStyle: TextStyle(
        color: colorScheme.onSurface,
      ),
      secondaryLabelStyle: TextStyle(
        color: colorScheme.onSurface,
      ),
      brightness: colorScheme.brightness,
      elevation: PlatformUtils.isIOS ? 0 : 2,
      pressElevation: PlatformUtils.isIOS ? 1 : 4,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      labelPadding: const EdgeInsets.symmetric(horizontal: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
      ),
      side: BorderSide(
        color: colorScheme.onSurface.withValues(alpha: 0.12),
        width: 1,
      ),
    );
  }

  /// Get platform-specific badge theme
  static BadgeThemeData getBadgeThemeData(ColorScheme colorScheme) {
    return BadgeThemeData(
      backgroundColor: colorScheme.error,
      textColor: colorScheme.onError,
      smallSize: 8,
      largeSize: 16,
      textStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    );
  }

  /// Get platform-specific tooltip theme
  static TooltipThemeData getTooltipThemeData(ColorScheme colorScheme) {
    return TooltipThemeData(
      decoration: BoxDecoration(
        color: colorScheme.onSurface,
        borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
      ),
      textStyle: TextStyle(
        color: colorScheme.surface,
        fontSize: 14,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      margin: const EdgeInsets.all(8),
      preferBelow: true,
      verticalOffset: 24,
      waitDuration: const Duration(milliseconds: 500),
      showDuration: const Duration(milliseconds: 1500),
    );
  }
}