import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';
import '../tokens/app_text_styles.dart';
import '../tokens/app_shadows.dart';

class AppButtons {
  // Primary elevated button
  static Widget primary({
    required String text,
    required VoidCallback onPressed,
    bool isLoading = false,
    bool isDisabled = false,
    Widget? icon,
    double? width,
    double height = AppSpacing.buttonHeight,
    EdgeInsets? padding,
    Color? backgroundColor,
    Color? foregroundColor,
  }) {
    return SizedBox(
      width: width,
      height: height,
      child: ElevatedButton(
        onPressed: isDisabled || isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor ?? AppColors.primary,
          foregroundColor: foregroundColor ?? AppColors.onPrimary,
          disabledBackgroundColor: AppColors.textDisabled,
          disabledForegroundColor: AppColors.textSecondary,
          elevation: 2,
          shadowColor: Colors.black.withValues(alpha: 0.1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          ),
          padding: padding ?? AppSpacing.buttonPadding,
        ),
        child: isLoading
            ? _buildLoadingIndicator(foregroundColor ?? AppColors.onPrimary)
            : _buildButtonContent(text, icon, foregroundColor ?? AppColors.onPrimary),
      ),
    );
  }

  // Secondary elevated button
  static Widget secondary({
    required String text,
    required VoidCallback onPressed,
    bool isLoading = false,
    bool isDisabled = false,
    Widget? icon,
    double? width,
    double height = AppSpacing.buttonHeight,
    EdgeInsets? padding,
  }) {
    return SizedBox(
      width: width,
      height: height,
      child: ElevatedButton(
        onPressed: isDisabled || isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.secondary,
          foregroundColor: AppColors.onSecondary,
          disabledBackgroundColor: AppColors.textDisabled,
          disabledForegroundColor: AppColors.textSecondary,
          elevation: 2,
          shadowColor: Colors.black.withValues(alpha: 0.1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          ),
          padding: padding ?? AppSpacing.buttonPadding,
        ),
        child: isLoading
            ? _buildLoadingIndicator(AppColors.onSecondary)
            : _buildButtonContent(text, icon, AppColors.onSecondary),
      ),
    );
  }

  // Outlined button
  static Widget outlined({
    required String text,
    required VoidCallback onPressed,
    bool isLoading = false,
    bool isDisabled = false,
    Widget? icon,
    double? width,
    double height = AppSpacing.buttonHeight,
    EdgeInsets? padding,
    Color? borderColor,
    Color? textColor,
  }) {
    return SizedBox(
      width: width,
      height: height,
      child: OutlinedButton(
        onPressed: isDisabled || isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: textColor ?? AppColors.primary,
          disabledForegroundColor: AppColors.textDisabled,
          side: BorderSide(
            color: borderColor ?? AppColors.primary,
            width: 1.5,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          ),
          padding: padding ?? AppSpacing.buttonPadding,
        ),
        child: isLoading
            ? _buildLoadingIndicator(AppColors.primary)
            : _buildButtonContent(text, icon, textColor ?? AppColors.primary),
      ),
    );
  }

  // Text button
  static Widget text({
    required String text,
    required VoidCallback onPressed,
    bool isLoading = false,
    bool isDisabled = false,
    Widget? icon,
    double? width,
    double height = AppSpacing.buttonHeight,
    EdgeInsets? padding,
    Color? textColor,
  }) {
    return SizedBox(
      width: width,
      height: height,
      child: TextButton(
        onPressed: isDisabled || isLoading ? null : onPressed,
        style: TextButton.styleFrom(
          foregroundColor: textColor ?? AppColors.primary,
          disabledForegroundColor: AppColors.textDisabled,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          ),
          padding: padding ?? AppSpacing.buttonPadding,
        ),
        child: isLoading
            ? _buildLoadingIndicator(AppColors.primary)
            : _buildButtonContent(text, icon, textColor ?? AppColors.primary),
      ),
    );
  }

  // Icon button
  static Widget icon({
    required IconData iconData,
    required VoidCallback onPressed,
    Color? color,
    double size = AppSpacing.iconButtonSize,
    double? iconSize,
    bool isDisabled = false,
    String? tooltip,
    Color? backgroundColor,
  }) {
    return Tooltip(
      message: tooltip ?? '',
      child: Container(
        width: size,
        height: size,
        decoration: backgroundColor != null
            ? BoxDecoration(
                color: backgroundColor,
                shape: BoxShape.circle,
              )
            : null,
        child: IconButton(
          onPressed: isDisabled ? null : onPressed,
          icon: Icon(
            iconData,
            color: color ?? AppColors.primary,
            size: iconSize ?? 24,
          ),
          style: IconButton.styleFrom(
            backgroundColor: backgroundColor,
            foregroundColor: color ?? AppColors.primary,
            disabledForegroundColor: AppColors.textDisabled,
            shape: const CircleBorder(),
            padding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }

  // Floating action button
  static Widget floating({
    required IconData icon,
    required VoidCallback onPressed,
    String? tooltip,
    Color? backgroundColor,
    Color? foregroundColor,
    bool isExtended = false,
    String? heroTag,
  }) {
    return FloatingActionButton(
      onPressed: onPressed,
      backgroundColor: backgroundColor ?? AppColors.primary,
      foregroundColor: foregroundColor ?? AppColors.onPrimary,
      tooltip: tooltip,
      heroTag: heroTag,
      child: Icon(icon),
    );
  }

  // Emergency button
  static Widget emergency({
    required String text,
    required VoidCallback onPressed,
    bool isLoading = false,
    bool isDisabled = false,
    Widget? icon,
    double? width,
    double height = AppSpacing.buttonHeight,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        gradient: AppColors.emergencyGradient,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
        boxShadow: AppShadows.large,
      ),
      child: ElevatedButton(
        onPressed: isDisabled || isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: AppColors.onPrimary,
          disabledBackgroundColor: AppColors.textDisabled,
          disabledForegroundColor: AppColors.textSecondary,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          ),
          padding: AppSpacing.buttonPadding,
        ),
        child: isLoading
            ? _buildLoadingIndicator(AppColors.onPrimary)
            : _buildButtonContent(text, icon, AppColors.onPrimary),
      ),
    );
  }

  // Loading state indicator
  static Widget _buildLoadingIndicator(Color color) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation<Color>(color),
      ),
    );
  }

  // Button content (text + icon)
  static Widget _buildButtonContent(String text, Widget? icon, Color textColor) {
    if (icon == null) {
      return Text(
        text,
        style: AppTextStyles.button.copyWith(
          color: textColor,
        ),
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        icon,
        SizedBox(width: AppSpacing.small),
        Text(
          text,
          style: AppTextStyles.button.copyWith(
            color: textColor,
          ),
        ),
      ],
    );
  }

  // Button group (horizontal)
  static Widget group({
    required List<Widget> children,
    double spacing = AppSpacing.small,
    CrossAxisAlignment alignment = CrossAxisAlignment.center,
  }) {
    return Row(
      crossAxisAlignment: alignment,
      children: children
          .expand((child) => [child, SizedBox(width: spacing)])
          .take(children.length * 2 - 1)
          .toList(),
    );
  }

  // Button stack (vertical)
  static Widget stack({
    required List<Widget> children,
    double spacing = AppSpacing.small,
    CrossAxisAlignment alignment = CrossAxisAlignment.center,
  }) {
    return Column(
      crossAxisAlignment: alignment,
      children: children
          .expand((child) => [child, SizedBox(height: spacing)])
          .take(children.length * 2 - 1)
          .toList(),
    );
  }
}