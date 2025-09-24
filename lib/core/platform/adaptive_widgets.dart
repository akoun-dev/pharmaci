import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'platform_utils.dart';

/// Adaptive scaffold that adjusts to platform-specific design patterns
class AdaptiveScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? floatingActionButton;
  final Widget? bottomNavigationBar;
  final Color? backgroundColor;
  final bool extendBody;
  final bool extendBodyBehindAppBar;
  final bool resizeToAvoidBottomInset;

  const AdaptiveScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.floatingActionButton,
    this.bottomNavigationBar,
    this.backgroundColor,
    this.extendBody = false,
    this.extendBodyBehindAppBar = false,
    this.resizeToAvoidBottomInset = true,
  });

  @override
  Widget build(BuildContext context) {
    if (PlatformUtils.isIOS) {
      return CupertinoPageScaffold(
        backgroundColor: backgroundColor ?? CupertinoColors.systemBackground,
        child: body,
      );
    }

    return Scaffold(
      appBar: appBar,
      body: body,
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: bottomNavigationBar,
      backgroundColor: backgroundColor,
      extendBody: extendBody,
      extendBodyBehindAppBar: extendBodyBehindAppBar,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
    );
  }
}

/// Adaptive app bar that follows platform design patterns
class AdaptiveAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool automaticallyImplyLeading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? elevation;

  const AdaptiveAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.automaticallyImplyLeading = true,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation,
  });

  @override
  Widget build(BuildContext context) {
    if (PlatformUtils.isIOS) {
      return CupertinoNavigationBar(
        backgroundColor: backgroundColor,
        middle: Text(
          title,
          style: TextStyle(
            color: foregroundColor ?? CupertinoColors.label,
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
        trailing: actions != null && actions!.isNotEmpty
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: actions!,
              )
            : null,
        leading: leading,
        automaticallyImplyLeading: automaticallyImplyLeading,
      );
    }

    return AppBar(
      title: Text(title),
      actions: actions,
      leading: leading,
      automaticallyImplyLeading: automaticallyImplyLeading,
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      elevation: elevation ?? PlatformUtils.appBarElevation,
      centerTitle: PlatformUtils.isIOS,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

/// Adaptive button that follows platform design patterns
class AdaptiveButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final ButtonStyle? style;
  final Widget? icon;
  final bool isLoading;
  final bool isDisabled;
  final AdaptiveButtonType type;

  const AdaptiveButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.style,
    this.icon,
    this.isLoading = false,
    this.isDisabled = false,
    this.type = AdaptiveButtonType.primary,
  });

  @override
  Widget build(BuildContext context) {
    if (PlatformUtils.isIOS) {
      return CupertinoButton(
        onPressed: isDisabled || isLoading ? null : onPressed,
        color: _getCupertinoButtonColor(context),
        disabledColor: CupertinoColors.quaternaryLabel,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
        child: _buildButtonContent(),
      );
    }

    return ElevatedButton(
      onPressed: isDisabled || isLoading ? null : onPressed,
      style: style ?? _getMaterialButtonStyle(context),
      child: _buildButtonContent(),
    );
  }

  Widget _buildButtonContent() {
    if (isLoading) {
      return SizedBox(
        height: 20,
        width: 20,
        child: PlatformUtils.isIOS
            ? const CupertinoActivityIndicator()
            : const CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          icon!,
          const SizedBox(width: 8),
          Text(text),
        ],
      );
    }

    return Text(text);
  }

  Color? _getCupertinoButtonColor(BuildContext context) {
    switch (type) {
      case AdaptiveButtonType.primary:
        return Theme.of(context).primaryColor;
      case AdaptiveButtonType.secondary:
        return CupertinoColors.secondaryLabel;
      case AdaptiveButtonType.danger:
        return CupertinoColors.systemRed;
      default:
        return Theme.of(context).primaryColor;
    }
  }

  ButtonStyle _getMaterialButtonStyle(BuildContext context) {
    switch (type) {
      case AdaptiveButtonType.primary:
        return ElevatedButton.styleFrom(
          backgroundColor: Theme.of(context).primaryColor,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
          ),
        );
      case AdaptiveButtonType.secondary:
        return ElevatedButton.styleFrom(
          backgroundColor: Colors.grey[200],
          foregroundColor: Colors.black87,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
          ),
        );
      case AdaptiveButtonType.danger:
        return ElevatedButton.styleFrom(
          backgroundColor: Colors.red,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
          ),
        );
      default:
        return ElevatedButton.styleFrom(
          backgroundColor: Theme.of(context).primaryColor,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(PlatformUtils.borderRadius),
          ),
        );
    }
  }
}

/// Adaptive text field that follows platform design patterns
class AdaptiveTextField extends StatefulWidget {
  final String? labelText;
  final String? hintText;
  final String? errorText;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool isEnabled;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final int? maxLines;

  const AdaptiveTextField({
    super.key,
    this.labelText,
    this.hintText,
    this.errorText,
    this.controller,
    this.onChanged,
    this.keyboardType,
    this.obscureText = false,
    this.isEnabled = true,
    this.suffixIcon,
    this.prefixIcon,
    this.maxLines = 1,
  });

  @override
  State<AdaptiveTextField> createState() => _AdaptiveTextFieldState();
}

class _AdaptiveTextFieldState extends State<AdaptiveTextField> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (PlatformUtils.isIOS) {
      return CupertinoTextField(
        controller: _controller,
        placeholder: widget.hintText,
        prefix: widget.prefixIcon,
        suffix: widget.suffixIcon,
        keyboardType: widget.keyboardType,
        obscureText: widget.obscureText,
        enabled: widget.isEnabled,
        maxLines: widget.maxLines,
        onChanged: widget.onChanged,
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: widget.errorText != null
                  ? CupertinoColors.systemRed
                  : CupertinoColors.separator,
              width: 1,
            ),
          ),
        ),
      );
    }

    return TextField(
      controller: _controller,
      decoration: InputDecoration(
        labelText: widget.labelText,
        hintText: widget.hintText,
        errorText: widget.errorText,
        prefixIcon: widget.prefixIcon,
        suffixIcon: widget.suffixIcon,
        border: PlatformUtils.inputBorder,
        enabledBorder: PlatformUtils.inputBorder,
        focusedBorder: PlatformUtils.inputBorder.copyWith(
          borderSide: BorderSide(
            color: Theme.of(context).primaryColor,
            width: 2,
          ),
        ),
        disabledBorder: PlatformUtils.inputBorder.copyWith(
          borderSide: BorderSide(
            color: Colors.grey.shade300,
          ),
        ),
        errorBorder: PlatformUtils.inputBorder.copyWith(
          borderSide: const BorderSide(color: Colors.red),
        ),
      ),
      keyboardType: widget.keyboardType,
      obscureText: widget.obscureText,
      enabled: widget.isEnabled,
      maxLines: widget.maxLines,
      onChanged: widget.onChanged,
    );
  }
}

/// Adaptive dialog that follows platform design patterns
class AdaptiveDialog extends StatelessWidget {
  final String title;
  final String content;
  final String? primaryActionText;
  final String? secondaryActionText;
  final VoidCallback? onPrimaryAction;
  final VoidCallback? onSecondaryAction;

  const AdaptiveDialog({
    super.key,
    required this.title,
    required this.content,
    this.primaryActionText,
    this.secondaryActionText,
    this.onPrimaryAction,
    this.onSecondaryAction,
  });

  @override
  Widget build(BuildContext context) {
    if (PlatformUtils.isIOS) {
      return CupertinoAlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          if (secondaryActionText != null)
            CupertinoDialogAction(
              child: Text(secondaryActionText!),
              onPressed: onSecondaryAction ?? () => Navigator.pop(context),
              isDefaultAction: false,
            ),
          CupertinoDialogAction(
            child: Text(primaryActionText ?? 'OK'),
            onPressed: onPrimaryAction ?? () => Navigator.pop(context),
            isDefaultAction: true,
            isDestructiveAction: primaryActionText?.toLowerCase() == 'delete',
          ),
        ],
      );
    }

    return AlertDialog(
      title: Text(title),
      content: Text(content),
      actions: [
        if (secondaryActionText != null)
          TextButton(
            child: Text(secondaryActionText!),
            onPressed: onSecondaryAction ?? () => Navigator.pop(context),
          ),
        TextButton(
          child: Text(primaryActionText ?? 'OK'),
          onPressed: onPrimaryAction ?? () => Navigator.pop(context),
          style: TextButton.styleFrom(
            foregroundColor: primaryActionText?.toLowerCase() == 'delete'
                ? Colors.red
                : Theme.of(context).primaryColor,
          ),
        ),
      ],
    );
  }
}

/// Adaptive bottom sheet that follows platform design patterns
class AdaptiveBottomSheet extends StatelessWidget {
  final Widget child;
  final String? title;
  final VoidCallback? onClose;

  const AdaptiveBottomSheet({
    super.key,
    required this.child,
    this.title,
    this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    if (PlatformUtils.isIOS) {
      return Container(
        decoration: const BoxDecoration(
          color: CupertinoColors.systemBackground,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (title != null) ...[
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        title!,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      CupertinoButton(
                        padding: EdgeInsets.zero,
                        onPressed: onClose ?? () => Navigator.pop(context),
                        child: const Icon(CupertinoIcons.clear),
                      ),
                    ],
                  ),
                ),
                const Divider(),
              ],
              Flexible(
                child: child,
              ),
            ],
          ),
        ),
      );
    }

    return DraggableScrollableSheet(
      initialChildSize: 0.5,
      minChildSize: 0.3,
      maxChildSize: 0.9,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              if (title != null) ...[
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        title!,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      IconButton(
                        onPressed: onClose ?? () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                ),
                const Divider(),
              ],
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: child,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Adaptive progress indicator that follows platform design patterns
class AdaptiveProgressIndicator extends StatelessWidget {
  final double? value;
  final String? message;
  final bool showPercentage;

  const AdaptiveProgressIndicator({
    super.key,
    this.value,
    this.message,
    this.showPercentage = false,
  });

  @override
  Widget build(BuildContext context) {
    if (PlatformUtils.isIOS) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (value == null)
            const CupertinoActivityIndicator()
          else
            LinearProgressIndicator(value: value),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(message!),
          ],
          if (showPercentage && value != null) ...[
            const SizedBox(height: 8),
            Text('${(value! * 100).toStringAsFixed(0)}%'),
          ],
        ],
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (value == null)
          const CircularProgressIndicator()
        else
          LinearProgressIndicator(value: value),
        if (message != null) ...[
          const SizedBox(height: 16),
          Text(message!),
        ],
        if (showPercentage && value != null) ...[
          const SizedBox(height: 8),
          Text('${(value! * 100).toStringAsFixed(0)}%'),
        ],
      ],
    );
  }
}

/// Button type enumeration for adaptive buttons
enum AdaptiveButtonType {
  primary,
  secondary,
  danger,
}