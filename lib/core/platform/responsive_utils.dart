import 'package:flutter/material.dart';

/// Responsive design utilities for cross-platform adaptations
class ResponsiveUtils {
  /// Get responsive value based on screen width
  static T getValue<T>(
    BuildContext context, {
    required T mobile,
    required T tablet,
    required T desktop,
  }) {
    final width = MediaQuery.of(context).size.width;

    if (width >= 1200) {
      return desktop;
    } else if (width >= 600) {
      return tablet;
    } else {
      return mobile;
    }
  }

  /// Get responsive padding
  static EdgeInsetsGeometry getResponsivePadding(BuildContext context) {
    return getValue(
      context,
      mobile: const EdgeInsets.all(16),
      tablet: const EdgeInsets.all(24),
      desktop: const EdgeInsets.all(32),
    );
  }

  /// Get responsive text size
  static double getResponsiveTextSize(BuildContext context, double baseSize) {
    final factor = getValue(
      context,
      mobile: 1.0,
      tablet: 1.2,
      desktop: 1.4,
    );
    return baseSize * factor;
  }

  /// Get responsive number of columns
  static int getResponsiveColumns(BuildContext context) {
    return getValue(
      context,
      mobile: 1,
      tablet: 2,
      desktop: 3,
    );
  }

  /// Get responsive card width
  static double getResponsiveCardWidth(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final padding = getResponsivePadding(context).horizontal;

    return getValue(
      context,
      mobile: width - padding,
      tablet: (width - padding - 16) / 2,
      desktop: (width - padding - 32) / 3,
    );
  }

  /// Check if device is in landscape mode
  static bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }

  /// Get device type based on screen size
  static DeviceType getDeviceType(BuildContext context) {
    final width = MediaQuery.of(context).size.width;

    if (width >= 1200) {
      return DeviceType.desktop;
    } else if (width >= 600) {
      return DeviceType.tablet;
    } else {
      return DeviceType.mobile;
    }
  }

  /// Get safe area padding
  static EdgeInsets getSafeAreaPadding(BuildContext context) {
    return MediaQuery.of(context).padding;
  }

  /// Get screen height
  static double getScreenHeight(BuildContext context) {
    return MediaQuery.of(context).size.height;
  }

  /// Get screen width
  static double getScreenWidth(BuildContext context) {
    return MediaQuery.of(context).size.width;
  }

  /// Get available height (minus safe areas)
  static double getAvailableHeight(BuildContext context) {
    return getScreenHeight(context) - getSafeAreaPadding(context).vertical;
  }

  /// Check if device has notch
  static bool hasNotch(BuildContext context) {
    final padding = MediaQuery.of(context).padding;
    return padding.top > 24;
  }

  /// Get responsive spacing
  static double getSpacing(BuildContext context, SpacingType type) {
    final factor = getValue(
      context,
      mobile: 1.0,
      tablet: 1.5,
      desktop: 2.0,
    );

    switch (type) {
      case SpacingType.xSmall:
        return 4.0 * factor;
      case SpacingType.small:
        return 8.0 * factor;
      case SpacingType.medium:
        return 16.0 * factor;
      case SpacingType.large:
        return 24.0 * factor;
      case SpacingType.xLarge:
        return 32.0 * factor;
      case SpacingType.xxLarge:
        return 48.0 * factor;
    }
  }
}

/// Device type enumeration
enum DeviceType {
  mobile,
  tablet,
  desktop,
}

/// Spacing type enumeration
enum SpacingType {
  xSmall,
  small,
  medium,
  large,
  xLarge,
  xxLarge,
}

/// Responsive builder widget
class ResponsiveBuilder extends StatelessWidget {
  final Widget Function(BuildContext context, DeviceType deviceType) builder;

  const ResponsiveBuilder({
    super.key,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    final deviceType = ResponsiveUtils.getDeviceType(context);
    return builder(context, deviceType);
  }
}

/// Responsive layout widget
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
  });

  @override
  Widget build(BuildContext context) {
    return ResponsiveBuilder(
      builder: (context, deviceType) {
        switch (deviceType) {
          case DeviceType.desktop:
            return desktop ?? tablet ?? mobile;
          case DeviceType.tablet:
            return tablet ?? mobile;
          case DeviceType.mobile:
            return mobile;
        }
      },
    );
  }
}

/// Responsive grid widget
class ResponsiveGrid extends StatelessWidget {
  final List<Widget> children;
  final double spacing;
  final double runSpacing;
  final int? maxColumns;

  const ResponsiveGrid({
    super.key,
    required this.children,
    this.spacing = 16,
    this.runSpacing = 16,
    this.maxColumns,
  });

  @override
  Widget build(BuildContext context) {
    return ResponsiveBuilder(
      builder: (context, deviceType) {
        final columns = (maxColumns ?? ResponsiveUtils.getResponsiveColumns(context))
            .clamp(1, children.length);

        return LayoutBuilder(
          builder: (context, constraints) {
            final itemWidth = (constraints.maxWidth - spacing * (columns - 1)) / columns;

            return Wrap(
              spacing: spacing,
              runSpacing: runSpacing,
              children: children.map((child) {
                return SizedBox(
                  width: itemWidth,
                  child: child,
                );
              }).toList(),
            );
          },
        );
      },
    );
  }
}

/// Responsive container widget
class ResponsiveContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? maxWidth;
  final bool centerContent;

  const ResponsiveContainer({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.maxWidth,
    this.centerContent = true,
  });

  @override
  Widget build(BuildContext context) {
    return ResponsiveBuilder(
      builder: (context, deviceType) {
        final effectiveMaxWidth = maxWidth ??
            ResponsiveUtils.getValue(
              context,
              mobile: double.infinity,
              tablet: 800.0,
              desktop: 1200.0,
            );

        Widget container = Container(
          width: double.infinity,
          constraints: BoxConstraints(maxWidth: effectiveMaxWidth),
          padding: padding ?? ResponsiveUtils.getResponsivePadding(context),
          margin: margin,
          child: child,
        );

        if (centerContent) {
          container = Center(child: container);
        }

        return container;
      },
    );
  }
}