import 'package:flutter/material.dart';

/// Micro-interactions and animation utilities for enhanced UX
class MicroInteractions {
  /// Create a subtle scale animation on tap
  static Widget scaleOnTap({
    required Widget child,
    double scaleAmount = 0.95,
    Duration duration = const Duration(milliseconds: 100),
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedScale(
        scale: 1.0,
        duration: duration,
        child: child,
      ),
    );
  }

  /// Create a shimmer loading effect
  static Widget shimmer({
    required Widget child,
    Gradient? gradient,
    Duration duration = const Duration(milliseconds: 1500),
  }) {
    return ShimmerLoading(
      child: child,
      gradient: gradient,
      duration: duration,
    );
  }

  /// Create a pulse animation for important elements
  static Widget pulse({
    required Widget child,
    double minScale = 1.0,
    double maxScale = 1.1,
    Duration duration = const Duration(milliseconds: 1000),
    bool infinite = true,
  }) {
    return AnimatedPulse(
      child: child,
      minScale: minScale,
      maxScale: maxScale,
      duration: duration,
      infinite: infinite,
    );
  }

  /// Create a bounce animation
  static Widget bounce({
    required Widget child,
    int bounceCount = 3,
    Duration duration = const Duration(milliseconds: 500),
  }) {
    return BounceAnimation(
      child: child,
      bounceCount: bounceCount,
      duration: duration,
    );
  }

  /// Create a slide-in animation with stagger
  static Widget slideIn({
    required Widget child,
    Offset beginOffset = const Offset(0, 0.3),
    Duration duration = const Duration(milliseconds: 600),
    Curve curve = Curves.easeOutCubic,
  }) {
    return SlideInAnimation(
      child: child,
      beginOffset: beginOffset,
      duration: duration,
      curve: curve,
    );
  }

  /// Create a fade-in animation
  static Widget fadeIn({
    required Widget child,
    Duration duration = const Duration(milliseconds: 500),
    Curve curve = Curves.easeIn,
  }) {
    return FadeInAnimation(
      child: child,
      duration: duration,
      curve: curve,
    );
  }
}

/// Shimmer loading effect widget
class ShimmerLoading extends StatefulWidget {
  final Widget child;
  final Gradient? gradient;
  final Duration duration;

  const ShimmerLoading({
    super.key,
    required this.child,
    this.gradient,
    this.duration = const Duration(milliseconds: 1500),
  });

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final defaultGradient = LinearGradient(
      colors: [
        Colors.grey[300]!,
        Colors.grey[100]!,
        Colors.grey[300]!,
      ],
      stops: const [0.0, 0.5, 1.0],
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
    );

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            return (widget.gradient ?? defaultGradient).createShader(
              Rect.fromLTWH(
                -bounds.width + (bounds.width * _controller.value),
                0.0,
                bounds.width * 2,
                bounds.height,
              ),
            );
          },
          child: widget.child,
        );
      },
    );
  }
}

/// Pulse animation widget
class AnimatedPulse extends StatefulWidget {
  final Widget child;
  final double minScale;
  final double maxScale;
  final Duration duration;
  final bool infinite;

  const AnimatedPulse({
    super.key,
    required this.child,
    this.minScale = 1.0,
    this.maxScale = 1.1,
    this.duration = const Duration(milliseconds: 1000),
    this.infinite = true,
  });

  @override
  State<AnimatedPulse> createState() => _AnimatedPulseState();
}

class _AnimatedPulseState extends State<AnimatedPulse> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: widget.minScale,
      end: widget.maxScale,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    if (widget.infinite) {
      _controller.repeat(reverse: true);
    } else {
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: widget.child,
        );
      },
    );
  }
}

/// Bounce animation widget
class BounceAnimation extends StatefulWidget {
  final Widget child;
  final int bounceCount;
  final Duration duration;

  const BounceAnimation({
    super.key,
    required this.child,
    this.bounceCount = 3,
    this.duration = const Duration(milliseconds: 500),
  });

  @override
  State<BounceAnimation> createState() => _BounceAnimationState();
}

class _BounceAnimationState extends State<BounceAnimation> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _bounceAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );

    _bounceAnimation = TweenSequence<double>([
      for (int i = 0; i < widget.bounceCount; i++)
        TweenSequenceItem<double>(
          tween: Tween<double>(begin: 0.0, end: -20.0),
          weight: 0.5,
        ),
      for (int i = 0; i < widget.bounceCount; i++)
        TweenSequenceItem<double>(
          tween: Tween<double>(begin: -20.0, end: 0.0),
          weight: 0.5,
        ),
    ]).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.elasticOut,
    ));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _bounceAnimation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _bounceAnimation.value),
          child: widget.child,
        );
      },
    );
  }
}

/// Slide-in animation widget
class SlideInAnimation extends StatefulWidget {
  final Widget child;
  final Offset beginOffset;
  final Duration duration;
  final Curve curve;

  const SlideInAnimation({
    super.key,
    required this.child,
    this.beginOffset = const Offset(0, 0.3),
    this.duration = const Duration(milliseconds: 600),
    this.curve = Curves.easeOutCubic,
  });

  @override
  State<SlideInAnimation> createState() => _SlideInAnimationState();
}

class _SlideInAnimationState extends State<SlideInAnimation> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );

    _slideAnimation = Tween<Offset>(
      begin: widget.beginOffset,
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: widget.curve,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: widget.curve,
    ));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: widget.child,
          ),
        );
      },
    );
  }
}

/// Fade-in animation widget
class FadeInAnimation extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;

  const FadeInAnimation({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 500),
    this.curve = Curves.easeIn,
  });

  @override
  State<FadeInAnimation> createState() => _FadeInAnimationState();
}

class _FadeInAnimationState extends State<FadeInAnimation> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: widget.curve,
    ));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _fadeAnimation,
      builder: (context, child) {
        return Opacity(
          opacity: _fadeAnimation.value,
          child: widget.child,
        );
      },
    );
  }
}

/// Interactive button with micro-interactions
class InteractiveButton extends StatefulWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final BorderRadius? borderRadius;
  final Duration animationDuration;

  const InteractiveButton({
    super.key,
    required this.child,
    this.onPressed,
    this.width,
    this.height,
    this.padding,
    this.backgroundColor,
    this.foregroundColor,
    this.borderRadius,
    this.animationDuration = const Duration(milliseconds: 100),
  });

  @override
  State<InteractiveButton> createState() => _InteractiveButtonState();
}

class _InteractiveButtonState extends State<InteractiveButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.onPressed,
      child: AnimatedContainer(
        duration: widget.animationDuration,
        width: widget.width,
        height: widget.height,
        padding: widget.padding ?? const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: widget.backgroundColor ?? Theme.of(context).primaryColor,
          borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: _isPressed ? 0.1 : 0.2),
              blurRadius: _isPressed ? 2 : 8,
              offset: Offset(0, _isPressed ? 1 : 4),
            ),
          ],
        ),
        child: DefaultTextStyle(
          style: TextStyle(
            color: widget.foregroundColor ?? Colors.white,
            fontWeight: FontWeight.w600,
          ),
          child: Center(child: widget.child),
        ),
      ),
    );
  }
}

/// Interactive card with hover and tap effects
class InteractiveCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double elevation;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const InteractiveCard({
    super.key,
    required this.child,
    this.onTap,
    this.elevation = 2.0,
    this.backgroundColor,
    this.borderRadius,
    this.margin,
    this.padding,
  });

  @override
  State<InteractiveCard> createState() => _InteractiveCardState();
}

class _InteractiveCardState extends State<InteractiveCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: widget.margin,
          padding: widget.padding,
          decoration: BoxDecoration(
            color: widget.backgroundColor ?? Theme.of(context).cardColor,
            borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: _isHovered ? 0.15 : 0.1),
                blurRadius: _isHovered ? widget.elevation + 4 : widget.elevation,
                spreadRadius: _isHovered ? 1 : 0,
              ),
            ],
          ),
          child: widget.child,
        ),
      ),
    );
  }
}