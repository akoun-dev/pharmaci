import 'package:flutter/material.dart';
import '../design_system/tokens/app_colors.dart';

class AppAccessibility {
  // Screen reader helper
  static bool isScreenReaderActive(BuildContext context) {
    return MediaQuery.of(context).accessibleNavigation;
  }

  // High contrast mode helper
  static bool isHighContrastMode(BuildContext context) {
    return MediaQuery.of(context).highContrast;
  }

  // Reduce motion helper
  static bool isReduceMotionEnabled(BuildContext context) {
    return MediaQuery.of(context).disableAnimations;
  }

  // Accessibility announcement
  static void announce(BuildContext context, String message) {
    // Announce message to screen readers
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  // Accessible text widget
  static Widget accessibleText({
    required String text,
    TextStyle? style,
    TextAlign? textAlign,
    String? semanticsLabel,
    int? maxLines,
    TextOverflow? overflow,
  }) {
    return Semantics(
      label: semanticsLabel ?? text,
      child: Text(
        text,
        style: style,
        textAlign: textAlign,
        maxLines: maxLines,
        overflow: overflow,
      ),
    );
  }

  // Accessible button
  static Widget accessibleButton({
    required Widget child,
    required VoidCallback? onPressed,
    String? semanticsLabel,
    bool isEnabled = true,
  }) {
    return Semantics(
      label: semanticsLabel,
      button: true,
      enabled: isEnabled,
      child: ExcludeSemantics(
        excluding: true,
        child: GestureDetector(
          onTap: isEnabled ? onPressed : null,
          child: child,
        ),
      ),
    );
  }

  // Accessible text field
  static Widget accessibleTextField({
    required TextEditingController controller,
    String? labelText,
    String? hintText,
    String? errorText,
    bool isRequired = false,
    bool isEnabled = true,
    TextInputType? keyboardType,
    ValueChanged<String>? onChanged,
  }) {
    return Semantics(
      label: labelText,
      hint: hintText,
      textField: true,
      enabled: isEnabled,
      child: ExcludeSemantics(
        excluding: true,
        child: TextField(
          controller: controller,
          decoration: InputDecoration(
            labelText: labelText,
            hintText: hintText,
            errorText: errorText,
          ),
          keyboardType: keyboardType,
          onChanged: onChanged,
          enabled: isEnabled,
        ),
      ),
    );
  }

  // Accessible switch
  static Widget accessibleSwitch({
    required bool value,
    required ValueChanged<bool>? onChanged,
    String? semanticsLabel,
    bool isEnabled = true,
  }) {
    return Semantics(
      label: semanticsLabel,
      checked: value,
      enabled: isEnabled,
      child: ExcludeSemantics(
        excluding: true,
        child: Switch(
          value: value,
          onChanged: isEnabled ? onChanged : null,
          activeThumbColor: AppColors.primary,
        ),
      ),
    );
  }

  // Accessible checkbox
  static Widget accessibleCheckbox({
    required bool value,
    required ValueChanged<bool?>? onChanged,
    String? semanticsLabel,
    bool isEnabled = true,
  }) {
    return Semantics(
      label: semanticsLabel,
      checked: value,
      enabled: isEnabled,
      child: ExcludeSemantics(
        excluding: true,
        child: Checkbox(
          value: value,
          onChanged: isEnabled ? onChanged : null,
          activeColor: AppColors.primary,
        ),
      ),
    );
  }

  // Accessible radio button
  static Widget accessibleRadio<T>({
    required T value,
    required T? groupValue,
    required ValueChanged<T?>? onChanged,
    String? semanticsLabel,
    bool isEnabled = true,
  }) {
    return Semantics(
      label: semanticsLabel,
      checked: value == groupValue,
      enabled: isEnabled,
      inMutuallyExclusiveGroup: true,
      child: ExcludeSemantics(
        excluding: true,
        child: Radio<T>(
          value: value,
          groupValue: groupValue,
          onChanged: isEnabled ? onChanged : null,
          activeColor: AppColors.primary,
        ),
      ),
    );
  }

  // Accessible slider
  static Widget accessibleSlider({
    required double value,
    required ValueChanged<double>? onChanged,
    String? semanticsLabel,
    bool isEnabled = true,
    double min = 0.0,
    double max = 1.0,
    int? divisions,
  }) {
    return Semantics(
      label: semanticsLabel,
      value: value.toStringAsFixed(1),
      enabled: isEnabled,
      slider: true,
      child: ExcludeSemantics(
        excluding: true,
        child: Slider(
          value: value,
          onChanged: isEnabled ? onChanged : null,
          min: min,
          max: max,
          divisions: divisions,
          activeColor: AppColors.primary,
        ),
      ),
    );
  }

  // Accessible list tile
  static Widget accessibleListTile({
    required Widget title,
    Widget? subtitle,
    Widget? leading,
    Widget? trailing,
    VoidCallback? onTap,
    String? semanticsLabel,
    bool isEnabled = true,
    bool selected = false,
  }) {
    return Semantics(
      label: semanticsLabel,
      button: onTap != null,
      enabled: isEnabled,
      selected: selected,
      child: ExcludeSemantics(
        excluding: onTap != null,
        child: ListTile(
          title: title,
          subtitle: subtitle,
          leading: leading,
          trailing: trailing,
          onTap: isEnabled ? onTap : null,
          selected: selected,
          enabled: isEnabled,
        ),
      ),
    );
  }

  // Accessible image
  static Widget accessibleImage({
    required String imageUrl,
    String? semanticsLabel,
    double? width,
    double? height,
    BoxFit fit = BoxFit.cover,
  }) {
    return Semantics(
      label: semanticsLabel,
      image: true,
      child: ExcludeSemantics(
        excluding: true,
        child: Image.network(
          imageUrl,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (context, error, stackTrace) {
            return const Icon(Icons.error_outline);
          },
        ),
      ),
    );
  }

  // Accessible icon
  static Widget accessibleIcon({
    required IconData icon,
    String? semanticsLabel,
    double? size,
    Color? color,
  }) {
    return Semantics(
      label: semanticsLabel,
      child: ExcludeSemantics(
        excluding: semanticsLabel != null,
        child: Icon(
          icon,
          size: size,
          color: color,
        ),
      ),
    );
  }

  // Accessible progress indicator
  static Widget accessibleProgressIndicator({
    required double value,
    String? semanticsLabel,
    String? semanticsValue,
  }) {
    return Semantics(
      label: semanticsLabel ?? 'Progress',
      value: semanticsValue ?? '${(value * 100).toStringAsFixed(0)}%',
      child: ExcludeSemantics(
        excluding: true,
        child: LinearProgressIndicator(
          value: value,
          color: AppColors.primary,
        ),
      ),
    );
  }

  // High contrast color helper
  static Color getHighContrastColor(BuildContext context, Color color) {
    if (isHighContrastMode(context)) {
      // Convert to high contrast version
      if (color == AppColors.primary) {
        return Colors.black;
      } else if (color == AppColors.secondary) {
        return Colors.black;
      } else if (color == AppColors.error) {
        return Colors.red.shade700;
      }
    }
    return color;
  }

  // Large text helper
  static TextStyle getLargeTextStyle(TextStyle style) {
    return style.copyWith(
      fontSize: (style.fontSize ?? 14) * 1.2,
    );
  }

  // Extra large text helper
  static TextStyle getExtraLargeTextStyle(TextStyle style) {
    return style.copyWith(
      fontSize: (style.fontSize ?? 14) * 1.4,
    );
  }

  // Accessible scaffold
  static Widget accessibleScaffold({
    required Widget body,
    PreferredSizeWidget? appBar,
    Widget? floatingActionButton,
    Widget? bottomNavigationBar,
  }) {
    return Scaffold(
      appBar: appBar,
      body: body,
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: bottomNavigationBar,
    );
  }

  // WCAG color contrast checker
  static bool hasSufficientContrast(Color foreground, Color background) {
    // Simple contrast ratio calculation
    double getLuminance(Color color) {
      return (0.299 * color.red + 0.587 * color.green + 0.114 * color.blue) / 255;
    }

    double fgLuminance = getLuminance(foreground);
    double bgLuminance = getLuminance(background);

    double lighter = fgLuminance > bgLuminance ? fgLuminance : bgLuminance;
    double darker = fgLuminance > bgLuminance ? bgLuminance : fgLuminance;

    return (lighter + 0.05) / (darker + 0.05) >= 4.5; // WCAG AA standard
  }

  // Focus order helper
  static void manageFocusOrder(BuildContext context, List<FocusNode> focusNodes) {
    // Focus order management would be implemented here
    // This is a placeholder for focus navigation implementation
  }
}