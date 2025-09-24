import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform;
import 'package:flutter/material.dart';

/// Platform detection utilities for cross-platform adaptations
class PlatformUtils {
  static final TargetPlatform _platform = defaultTargetPlatform;

  /// Returns true if running on iOS
  static bool get isIOS => _platform == TargetPlatform.iOS;

  /// Returns true if running on Android
  static bool get isAndroid => _platform == TargetPlatform.android;

  /// Returns true if running on Web
  static bool get isWeb => _platform == TargetPlatform.windows ||
                           _platform == TargetPlatform.linux ||
                           _platform == TargetPlatform.macOS;

  /// Returns true if running on desktop (Windows, macOS, Linux)
  static bool get isDesktop => _platform == TargetPlatform.windows ||
                              _platform == TargetPlatform.macOS ||
                              _platform == TargetPlatform.linux;

  /// Returns true if running on mobile (iOS, Android)
  static bool get isMobile => isIOS || isAndroid;

  /// Returns the platform name as a string
  static String get platformName {
    switch (_platform) {
      case TargetPlatform.iOS:
        return 'iOS';
      case TargetPlatform.android:
        return 'Android';
      case TargetPlatform.windows:
        return 'Windows';
      case TargetPlatform.macOS:
        return 'macOS';
      case TargetPlatform.linux:
        return 'Linux';
      default:
        return 'Unknown';
    }
  }

  /// Returns platform-specific app bar elevation
  static double get appBarElevation {
    if (isIOS) return 0.0;
    if (isAndroid) return 4.0;
    return 2.0;
  }

  /// Returns platform-specific border radius
  static double get borderRadius {
    if (isIOS) return 12.0;
    if (isAndroid) return 8.0;
    return 8.0;
  }

  /// Returns platform-specific button height
  static double get buttonHeight {
    if (isIOS) return 44.0;
    if (isAndroid) return 48.0;
    return 48.0;
  }

  /// Returns platform-specific input decoration border
  static InputBorder get inputBorder {
    if (isIOS) {
      return OutlineInputBorder(
        borderRadius: BorderRadius.circular(borderRadius),
        borderSide: BorderSide(color: Colors.grey.shade300),
      );
    }
    return UnderlineInputBorder(
      borderSide: BorderSide(color: Colors.grey.shade400),
    );
  }

  /// Returns platform-specific scroll physics
  static ScrollPhysics get scrollPhysics {
    if (isIOS) return const BouncingScrollPhysics();
    return const ClampingScrollPhysics();
  }

  /// Returns platform-specific page transition
  static PageTransitionsBuilder get pageTransition {
    if (isIOS) return const CupertinoPageTransitionsBuilder();
    return const FadeUpwardsPageTransitionsBuilder();
  }

  /// Returns platform-specific back button behavior
  static bool get hasBackButton => !isIOS;

  /// Returns platform-specific safe area behavior
  static bool get extendBodyBehindAppBar => isIOS;
}