import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';
import '../tokens/app_text_styles.dart';
import '../tokens/app_shadows.dart';
import 'app_buttons.dart';

class AppCards {
  // Basic card
  static Widget basic({
    required Widget child,
    EdgeInsets? padding,
    EdgeInsets? margin,
    Color? backgroundColor,
    Color? borderColor,
    double? width,
    double? height,
    VoidCallback? onTap,
    BorderRadius? borderRadius,
    bool showShadow = true,
  }) {
    return Container(
      width: width,
      height: height,
      margin: margin ?? AppSpacing.cardPadding,
      child: Material(
        color: backgroundColor ?? AppColors.surface,
        borderRadius: borderRadius ?? AppSpacing.borderRadiusMedium,
        elevation: showShadow ? 2 : 0,
        shadowColor: Colors.black.withValues(alpha: 0.1),
        child: InkWell(
          onTap: onTap,
          borderRadius: borderRadius ?? AppSpacing.borderRadiusMedium,
          child: Container(
            padding: padding ?? AppSpacing.cardContentPadding,
            decoration: BoxDecoration(
              color: Colors.transparent,
              borderRadius: borderRadius ?? AppSpacing.borderRadiusMedium,
              border: borderColor != null
                  ? Border.all(color: borderColor, width: 1)
                  : null,
            ),
            child: child,
          ),
        ),
      ),
    );
  }

  // Pharmacy card
  static Widget pharmacy({
    required String name,
    required String address,
    required String phone,
    required bool isOpen,
    required double distance,
    String? imageUrl,
    VoidCallback? onTap,
    VoidCallback? onCallTap,
    VoidCallback? onDirectionTap,
    Widget? actionButton,
  }) {
    return basic(
      padding: EdgeInsets.zero,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Pharmacy image or placeholder
          Container(
            height: 120,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppSpacing.radiusMedium),
              ),
            ),
            child: imageUrl != null
                ? Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return _buildPharmacyPlaceholder();
                    },
                  )
                : _buildPharmacyPlaceholder(),
          ),

          // Pharmacy details
          Padding(
            padding: AppSpacing.cardContentPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: AppTextStyles.pharmacyName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.small,
                        vertical: AppSpacing.xSmall,
                      ),
                      decoration: BoxDecoration(
                        color: isOpen ? AppColors.open.withValues(alpha: 0.1) : AppColors.closed.withValues(alpha: 0.1),
                        borderRadius: AppSpacing.borderRadiusSmall,
                      ),
                      child: Text(
                        isOpen ? 'Ouvert' : 'Fermé',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: isOpen ? AppColors.open : AppColors.closed,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: AppSpacing.xSmall),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 16,
                      color: AppColors.textSecondary,
                    ),
                    SizedBox(width: AppSpacing.xSmall),
                    Expanded(
                      child: Text(
                        address,
                        style: AppTextStyles.body2,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: AppSpacing.xSmall),
                Row(
                  children: [
                    const Icon(
                      Icons.phone_outlined,
                      size: 16,
                      color: AppColors.textSecondary,
                    ),
                    SizedBox(width: AppSpacing.xSmall),
                    Text(
                      phone,
                      style: AppTextStyles.body2,
                    ),
                    const Spacer(),
                    const Icon(
                      Icons.directions_outlined,
                      size: 16,
                      color: AppColors.textSecondary,
                    ),
                    SizedBox(width: AppSpacing.xSmall),
                    Text(
                      '${distance.toStringAsFixed(1)} km',
                      style: AppTextStyles.body2,
                    ),
                  ],
                ),
                if (actionButton != null) ...[
                  SizedBox(height: AppSpacing.small),
                  actionButton,
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Drug card
  static Widget drug({
    required String name,
    required String description,
    required double price,
    required bool isAvailable,
    String? imageUrl,
    VoidCallback? onTap,
    VoidCallback? onReserveTap,
    String? pharmacyName,
    int? stockQuantity,
  }) {
    return basic(
      onTap: onTap,
      child: Row(
        children: [
          // Drug image
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: AppSpacing.borderRadiusMedium,
            ),
            child: imageUrl != null
                ? ClipRRect(
                    borderRadius: AppSpacing.borderRadiusMedium,
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return const Icon(
                          Icons.medication_outlined,
                          size: 32,
                          color: AppColors.primary,
                        );
                      },
                    ),
                  )
                : const Icon(
                    Icons.medication_outlined,
                    size: 32,
                    color: AppColors.primary,
                  ),
          ),
          SizedBox(width: AppSpacing.medium),

          // Drug details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: AppTextStyles.drugName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.small,
                        vertical: AppSpacing.xSmall,
                      ),
                      decoration: BoxDecoration(
                        color: isAvailable
                            ? AppColors.available.withValues(alpha: 0.1)
                            : AppColors.limited.withValues(alpha: 0.1),
                        borderRadius: AppSpacing.borderRadiusSmall,
                      ),
                      child: Text(
                        isAvailable
                            ? stockQuantity != null && stockQuantity > 10
                                ? 'Disponible'
                                : 'Stock limité'
                            : 'Indisponible',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: isAvailable
                              ? AppColors.available
                              : AppColors.limited,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: AppSpacing.xSmall),
                Text(
                  description,
                  style: AppTextStyles.body2,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (pharmacyName != null) ...[
                  SizedBox(height: AppSpacing.xSmall),
                  Text(
                    pharmacyName,
                    style: AppTextStyles.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                SizedBox(height: AppSpacing.xSmall),
                Row(
                  children: [
                    Text(
                      '${price.toStringAsFixed(0)} FCFA',
                      style: AppTextStyles.price,
                    ),
                    const Spacer(),
                    if (isAvailable && onReserveTap != null)
                      AppButtons.text(
                        text: 'Réserver',
                        onPressed: onReserveTap,
                        textColor: AppColors.primary,
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Status card
  static Widget status({
    required String title,
    required String value,
    required IconData icon,
    Color? iconColor,
    Color? backgroundColor,
    Color? textColor,
    VoidCallback? onTap,
  }) {
    return basic(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.medium),
      backgroundColor: backgroundColor ?? AppColors.background,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.small),
                decoration: BoxDecoration(
                  color: (iconColor ?? AppColors.primary).withValues(alpha: 0.1),
                  borderRadius: AppSpacing.borderRadiusSmall,
                ),
                child: Icon(
                  icon,
                  color: iconColor ?? AppColors.primary,
                  size: 20,
                ),
              ),
              const Spacer(),
              Text(
                value,
                style: AppTextStyles.headline5.copyWith(
                  color: textColor ?? AppColors.textPrimary,
                ),
              ),
            ],
          ),
          SizedBox(height: AppSpacing.small),
          Text(
            title,
            style: AppTextStyles.caption.copyWith(
              color: textColor ?? AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  // Loading card
  static Widget loading({double height = 200}) {
    return Container(
      height: height,
      margin: AppSpacing.cardPadding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.borderRadiusMedium,
        boxShadow: AppShadows.medium,
      ),
      child: const Center(
        child: CircularProgressIndicator(),
      ),
    );
  }

  // Error card
  static Widget error({
    required String message,
    String? title,
    VoidCallback? onRetry,
    double height = 200,
  }) {
    return Container(
      height: height,
      margin: AppSpacing.cardPadding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.borderRadiusMedium,
        boxShadow: AppShadows.medium,
      ),
      child: Center(
        child: Padding(
          padding: AppSpacing.medium,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 48,
                color: AppColors.error,
              ),
              SizedBox(height: AppSpacing.medium),
              if (title != null)
                Text(
                  title,
                  style: AppTextStyles.headline6,
                  textAlign: TextAlign.center,
                ),
              if (title != null) SizedBox(height: AppSpacing.small),
              Text(
                message,
                style: AppTextStyles.body2,
                textAlign: TextAlign.center,
              ),
              if (onRetry != null) ...[
                SizedBox(height: AppSpacing.medium),
                AppButtons.primary(
                  text: 'Réessayer',
                  onPressed: onRetry,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // Empty state card
  static Widget empty({
    required String message,
    String? title,
    IconData? icon,
    double height = 200,
  }) {
    return Container(
      height: height,
      margin: AppSpacing.cardPadding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.borderRadiusMedium,
        boxShadow: AppShadows.medium,
      ),
      child: Center(
        child: Padding(
          padding: AppSpacing.medium,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon ?? Icons.inbox_outlined,
                size: 48,
                color: AppColors.textSecondary,
              ),
              SizedBox(height: AppSpacing.medium),
              if (title != null)
                Text(
                  title,
                  style: AppTextStyles.headline6,
                  textAlign: TextAlign.center,
                ),
              if (title != null) SizedBox(height: AppSpacing.small),
              Text(
                message,
                style: AppTextStyles.body2,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Pharmacy placeholder widget
  static Widget _buildPharmacyPlaceholder() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.local_pharmacy_outlined,
            size: 48,
            color: AppColors.primary,
          ),
          SizedBox(height: AppSpacing.small),
          Text(
            'Pharmacie',
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}