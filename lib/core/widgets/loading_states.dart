import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:pharmaci/core/design_system/tokens/app_colors.dart';
import 'package:pharmaci/core/design_system/tokens/app_spacing.dart';
import 'package:pharmaci/core/design_system/tokens/app_text_styles.dart';
import 'package:pharmaci/core/animations/micro_interactions.dart';

/// Enhanced loading states with animations and micro-interactions
class LoadingStates {
  /// Create a shimmer loading placeholder for cards
  static Widget shimmerCard({
    double height = 120,
    double width = double.infinity,
    BorderRadius? borderRadius,
  }) {
    return MicroInteractions.shimmer(
      child: Container(
        height: height,
        width: width,
        decoration: BoxDecoration(
          color: Colors.grey[300],
          borderRadius: borderRadius ?? BorderRadius.circular(AppSpacing.radiusMedium),
        ),
      ),
    );
  }

  /// Create a shimmer loading placeholder for lists
  static Widget shimmerList({
    int itemCount = 5,
    double itemHeight = 80,
    EdgeInsetsGeometry? padding,
  }) {
    return ListView.builder(
      padding: padding,
      itemCount: itemCount,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
              // Image placeholder
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              const SizedBox(width: 16),
              // Text placeholders
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 20,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 16,
                      width: 150,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 14,
                      width: 100,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Create a pulse loading animation
  static Widget pulseLoading({
    String? message,
    Widget? customIndicator,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          MicroInteractions.pulse(
            child: customIndicator ?? _defaultPulseIndicator(),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message,
              style: AppTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  /// Create a skeleton loading for forms
  static Widget skeletonForm({
    int fieldCount = 4,
  }) {
    return Column(
      children: List.generate(fieldCount, (index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 16,
                width: 100,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                height: 48,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  /// Create a Lottie animation loading
  static Widget lottieLoading({
    required String assetPath,
    double? width,
    double? height,
    String? message,
    bool repeat = true,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Lottie.asset(
            assetPath,
            width: width,
            height: height,
            repeat: repeat,
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message,
              style: AppTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  /// Create a progress loading with percentage
  static Widget progressLoading({
    required double progress,
    String? message,
    Color? progressColor,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 200,
            child: Column(
              children: [
                LinearProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    progressColor ?? AppColors.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${(progress * 100).round()}%',
                  style: AppTextStyles.bodySmall,
                ),
              ],
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message,
              style: AppTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  /// Create a stepped progress indicator
  static Widget steppedProgress({
    required int currentStep,
    required int totalSteps,
    List<String>? stepLabels,
  }) {
    return Column(
      children: [
        Row(
          children: List.generate(totalSteps, (index) {
            final isCompleted = index < currentStep;
            final isCurrent = index == currentStep - 1;

            return Expanded(
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? AppColors.primary
                            : Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  if (index < totalSteps - 1) ...[
                    const SizedBox(width: 8),
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? AppColors.primary
                            : Colors.grey[300],
                        shape: BoxShape.circle,
                        border: isCurrent
                            ? Border.all(color: AppColors.primary, width: 2)
                            : null,
                      ),
                      child: isCompleted
                          ? const Icon(
                              Icons.check,
                              color: Colors.white,
                              size: 16,
                            )
                          : isCurrent
                              ? Container(
                                  width: 12,
                                  height: 12,
                                  decoration: BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                )
                              : null,
                    ),
                    const SizedBox(width: 8),
                  ],
                ],
              ),
            );
          }),
        ),
        if (stepLabels != null) ...[
          const SizedBox(height: 16),
          Row(
            children: List.generate(totalSteps, (index) {
              return Expanded(
                child: Text(
                  stepLabels[index],
                  style: AppTextStyles.labelSmall,
                  textAlign: TextAlign.center,
                ),
              );
            }),
          ),
        ],
      ],
    );
  }

  /// Create a bouncing dots loading animation
  static Widget bouncingDots({
    int dotCount = 3,
    Color? dotColor,
    double dotSize = 8,
    String? message,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(dotCount, (index) {
              return Padding(
                padding: EdgeInsets.only(right: index < dotCount - 1 ? 8 : 0),
                child: MicroInteractions.bounce(
                  bounceCount: 1,
                  duration: Duration(milliseconds: 600 + (index * 200)),
                  child: Container(
                    width: dotSize,
                    height: dotSize,
                    decoration: BoxDecoration(
                      color: dotColor ?? AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              );
            }),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message,
              style: AppTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  /// Create a spinning loading animation
  static Widget spinningLoading({
    String? message,
    Color? spinnerColor,
    double strokeWidth = 3,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(
              strokeWidth: strokeWidth,
              valueColor: AlwaysStoppedAnimation<Color>(
                spinnerColor ?? AppColors.primary,
              ),
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message,
              style: AppTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  /// Create a page transition loading
  static Widget pageTransitionLoading({
    String? message,
  }) {
    return Container(
      color: Colors.white.withValues(alpha: 0.9),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            MicroInteractions.lottieLoading(
              assetPath: 'assets/animations/loading.json',
              width: 120,
              height: 120,
            ),
            if (message != null) ...[
              const SizedBox(height: 16),
              Text(
                message,
                style: AppTextStyles.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }

  static Widget _defaultPulseIndicator() {
    return Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        color: AppColors.primary,
        shape: BoxShape.circle,
      ),
      child: const Icon(
        Icons.local_pharmacy,
        color: Colors.white,
        size: 24,
      ),
    );
  }
}

/// Empty state widget with animations
class EmptyState extends StatelessWidget {
  final String title;
  final String? message;
  final Widget? icon;
  final Widget? actionButton;
  final String? actionText;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    required this.title,
    this.message,
    this.icon,
    this.actionButton,
    this.actionText,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          MicroInteractions.slideIn(
            child: icon ?? _defaultEmptyIcon(),
          ),
          const SizedBox(height: 24),
          MicroInteractions.fadeIn(
            duration: const Duration(milliseconds: 800),
            child: Text(
              title,
              style: AppTextStyles.headline5,
              textAlign: TextAlign.center,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 8),
            MicroInteractions.fadeIn(
              duration: const Duration(milliseconds: 1000),
              child: Text(
                message!,
                style: AppTextStyles.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ),
          ],
          if (actionButton != null || (actionText != null && onAction != null)) ...[
            const SizedBox(height: 24),
            MicroInteractions.fadeIn(
              duration: const Duration(milliseconds: 1200),
              child: actionButton ??
                  InteractiveButton(
                    onPressed: onAction,
                    child: Text(actionText ?? 'Action'),
                  ),
            ),
          ],
        ],
      ),
    );
  }

  static Widget _defaultEmptyIcon() {
    return Icon(
      Icons.inbox_outlined,
      size: 64,
      color: AppColors.onSurface.withValues(alpha: 0.3),
    );
  }
}

/// Error state widget with animations
class ErrorState extends StatelessWidget {
  final String title;
  final String? message;
  final Widget? icon;
  final VoidCallback? onRetry;
  final String? retryText;

  const ErrorState({
    super.key,
    required this.title,
    this.message,
    this.icon,
    this.onRetry,
    this.retryText,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          MicroInteractions.bounce(
            child: icon ?? _defaultErrorIcon(),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: AppTextStyles.headline5,
            textAlign: TextAlign.center,
          ),
          if (message != null) ...[
            const SizedBox(height: 8),
            Text(
              message!,
              style: AppTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
          if (onRetry != null) ...[
            const SizedBox(height: 24),
            InteractiveButton(
              onPressed: onRetry,
              backgroundColor: AppColors.error,
              child: Text(retryText ?? 'Réessayer'),
            ),
          ],
        ],
      ),
    );
  }

  static Widget _defaultErrorIcon() {
    return Icon(
      Icons.error_outline,
      size: 64,
      color: AppColors.error,
    );
  }
}