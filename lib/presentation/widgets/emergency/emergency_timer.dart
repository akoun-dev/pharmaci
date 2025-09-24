import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/accessibility/app_accessibility.dart';
import '../../../core/design_system/tokens/app_colors.dart';
import '../../../core/design_system/tokens/app_spacing.dart';
import '../../../core/design_system/tokens/app_text_styles.dart';

class EmergencyTimer extends StatefulWidget {
  final VoidCallback onTimerEnd;
  final int initialMinutes;

  const EmergencyTimer({
    super.key,
    required this.onTimerEnd,
    this.initialMinutes = 5,
  });

  @override
  State<EmergencyTimer> createState() => _EmergencyTimerState();
}

class _EmergencyTimerState extends State<EmergencyTimer> with SingleTickerProviderStateMixin {
  late int _initialSeconds;
  int _seconds = 0;
  Timer? _timer;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _initialSeconds = widget.initialMinutes * 60;
    _seconds = _initialSeconds;
    _pulseController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        if (_seconds > 0) {
          _seconds--;
          if (_seconds <= 30) {
            _pulseController.repeat(reverse: true);
          }
        } else {
          _timer?.cancel();
          _pulseController.stop();
          widget.onTimerEnd();
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final minutes = _seconds ~/ 60;
    final seconds = _seconds % 60;
    final timeString = '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    final progress = _seconds / _initialSeconds;
    final isCritical = _seconds <= 30;

    return Container(
        padding: const EdgeInsets.all(AppSpacing.large),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.3),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Icon(
                  Icons.timer_outlined,
                  color: Colors.white,
                  size: 20,
                ),
                SizedBox(width: AppSpacing.small),
                AppAccessibility.accessibleText(
                  text: 'Temps restant',
                  style: AppTextStyles.body1.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                  ),
                  semanticsLabel: 'Temps restant pour l\'urgence',
                ),
              ],
            ),
            SizedBox(height: AppSpacing.medium),
            AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: isCritical ? _pulseAnimation.value : 1.0,
                  child: AppAccessibility.accessibleText(
                    text: timeString,
                    style: AppTextStyles.headline2.copyWith(
                      color: isCritical ? AppColors.error : Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 40,
                    ),
                    semanticsLabel: '$minutes minutes et $seconds secondes restantes',
                  ),
                );
              },
            ),
            SizedBox(height: AppSpacing.medium),
            AppAccessibility.accessibleProgressIndicator(
              value: progress,
              semanticsLabel: 'Progression du temps d\'urgence',
              semanticsValue: '${(progress * 100).toStringAsFixed(0)}% restant',
            ),
            if (isCritical) ...[
              SizedBox(height: AppSpacing.small),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.small,
                  vertical: AppSpacing.xSmall,
                ),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.8),
                  borderRadius: AppSpacing.borderRadiusSmall,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.warning_amber,
                      color: Colors.white,
                      size: 16,
                    ),
                    SizedBox(width: AppSpacing.xSmall),
                    AppAccessibility.accessibleText(
                      text: 'URGENCE',
                      style: AppTextStyles.caption.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}