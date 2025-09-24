import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:pharmaci/core/localization/app_localizations.dart';
import 'package:pharmaci/core/design_system/tokens/app_colors.dart';
import 'package:pharmaci/core/design_system/tokens/app_spacing.dart';
import 'package:pharmaci/core/design_system/tokens/app_text_styles.dart';
import 'package:pharmaci/core/animations/micro_interactions.dart';

/// Language selection widget
class LanguageSelector extends StatelessWidget {
  final ValueChanged<Locale>? onLanguageChanged;

  const LanguageSelector({
    super.key,
    this.onLanguageChanged,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<Locale>(
      onSelected: (locale) {
        if (onLanguageChanged != null) {
          onLanguageChanged!(locale);
        }
        context.setLocale(locale);
      },
      itemBuilder: (context) => [
        const PopupMenuItem(
          value: Locale('fr', 'CI'),
          child: Text('Français (Côte d\'Ivoire)'),
        ),
        const PopupMenuItem(
          value: Locale('en', 'US'),
          child: Text('English (United States)'),
        ),
      ],
      child: InteractiveButton(
        onPressed: null,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.language,
              size: 20,
              color: AppColors.onSurface,
            ),
            const SizedBox(width: 8),
            Text(
              context.locale.languageCode == 'fr' ? 'FR' : 'EN',
              style: AppTextStyles.bodyMedium,
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.arrow_drop_down,
              size: 20,
              color: AppColors.onSurface,
            ),
          ],
        ),
      ),
    );
  }
}

/// Localized settings screen
class LocalizationSettingsScreen extends StatefulWidget {
  const LocalizationSettingsScreen({super.key});

  @override
  State<LocalizationSettingsScreen> createState() => _LocalizationSettingsScreenState();
}

class _LocalizationSettingsScreenState extends State<LocalizationSettingsScreen> {
  Locale? _selectedLocale;

  @override
  void initState() {
    super.initState();
    _selectedLocale = context.locale;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('settings.language'.tr()),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Current language display
          Container(
            padding: AppSpacing.paddingMedium,
            color: AppColors.surface,
            child: Row(
              children: [
                Icon(
                  Icons.language,
                  color: AppColors.primary,
                  size: 24,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'settings.language'.tr(),
                        style: AppTextStyles.headline6,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _getLanguageName(_selectedLocale!),
                        style: AppTextStyles.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Language options
          Expanded(
            child: ListView(
              children: [
                _buildLanguageOption(
                  context,
                  locale: const Locale('fr', 'CI'),
                  name: 'Français',
                  subtitle: 'Côte d\'Ivoire',
                  flag: '🇨🇮',
                ),
                _buildLanguageOption(
                  context,
                  locale: const Locale('en', 'US'),
                  name: 'English',
                  subtitle: 'United States',
                  flag: '🇺🇸',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageOption(
    BuildContext context, {
    required Locale locale,
    required String name,
    required String subtitle,
    required String flag,
  }) {
    final isSelected = _selectedLocale == locale;

    return InteractiveCard(
      onTap: () {
        setState(() {
          _selectedLocale = locale;
        });
        context.setLocale(locale);
      },
      margin: AppSpacing.marginSmall,
      padding: AppSpacing.paddingMedium,
      child: Row(
        children: [
          Text(
            flag,
            style: const TextStyle(fontSize: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: AppTextStyles.headline6.copyWith(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: AppTextStyles.bodySmall,
                ),
              ],
            ),
          ),
          if (isSelected)
            Icon(
              Icons.check_circle,
              color: AppColors.primary,
              size: 24,
            ),
        ],
      ),
    );
  }

  String _getLanguageName(Locale locale) {
    switch (locale.languageCode) {
      case 'fr':
        return 'Français (Côte d\'Ivoire)';
      case 'en':
        return 'English (United States)';
      default:
        return locale.languageCode;
    }
  }
}

/// Localized text widget with automatic translation
class LocalizedText extends StatelessWidget {
  final String key;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;
  final Map<String, String>? args;

  const LocalizedText({
    super.key,
    required this.key,
    this.style,
    this.textAlign,
    this.maxLines,
    this.overflow,
    this.args,
  });

  @override
  Widget build(BuildContext context) {
    String text = key.tr();

    if (args != null) {
      for (final entry in args!.entries) {
        text = text.replaceAll('${entry.key}', entry.value);
      }
    }

    return Text(
      text,
      style: style,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
    );
  }
}

/// Localized button with automatic translation
class LocalizedButton extends StatelessWidget {
  final String key;
  final VoidCallback? onPressed;
  final ButtonStyle? style;
  final Widget? icon;
  final Map<String, String>? args;

  const LocalizedButton({
    super.key,
    required this.key,
    this.onPressed,
    this.style,
    this.icon,
    this.args,
  });

  @override
  Widget build(BuildContext context) {
    String text = key.tr();

    if (args != null) {
      for (final entry in args!.entries) {
        text = text.replaceAll('${entry.key}', entry.value);
      }
    }

    return ElevatedButton(
      onPressed: onPressed,
      style: style,
      child: icon != null
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                icon!,
                const SizedBox(width: 8),
                Text(text),
              ],
            )
          : Text(text),
    );
  }
}

/// Localized input field with automatic translation
class LocalizedInputField extends StatelessWidget {
  final String labelKey;
  final String? hintKey;
  final String? errorKey;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool enabled;
  final int? maxLines;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;

  const LocalizedInputField({
    super.key,
    required this.labelKey,
    this.hintKey,
    this.errorKey,
    this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.enabled = true,
    this.maxLines = 1,
    this.onChanged,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      enabled: enabled,
      maxLines: maxLines,
      onChanged: onChanged,
      validator: validator,
      decoration: InputDecoration(
        labelText: labelKey.tr(),
        hintText: hintKey?.tr(),
        errorText: errorKey?.tr(),
      ),
    );
  }
}

/// Localized app bar with automatic translation
class LocalizedAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String titleKey;
  final List<Widget>? actions;
  final Widget? leading;
  final bool automaticallyImplyLeading;
  final Map<String, String>? titleArgs;

  const LocalizedAppBar({
    super.key,
    required this.titleKey,
    this.actions,
    this.leading,
    this.automaticallyImplyLeading = true,
    this.titleArgs,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    String title = titleKey.tr();

    if (titleArgs != null) {
      for (final entry in titleArgs!.entries) {
        title = title.replaceAll('${entry.key}', entry.value);
      }
    }

    return AppBar(
      title: Text(title),
      actions: actions,
      leading: leading,
      automaticallyImplyLeading: automaticallyImplyLeading,
    );
  }
}

/// Localized bottom navigation bar
class LocalizedBottomNavigationBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const LocalizedBottomNavigationBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      type: BottomNavigationBarType.fixed,
      items: [
        BottomNavigationBarItem(
          icon: const Icon(Icons.home),
          label: 'pharmacy.pharmacies'.tr(),
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.search),
          label: 'search.search'.tr(),
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.receipt),
          label: 'reservation.reservations'.tr(),
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.person),
          label: 'profile.profile'.tr(),
        ),
      ],
    );
  }
}

/// Localized dialog with automatic translation
class LocalizedDialog extends StatelessWidget {
  final String titleKey;
  final String? contentKey;
  final List<Widget>? actions;
  final Map<String, String>? titleArgs;
  final Map<String, String>? contentArgs;

  const LocalizedDialog({
    super.key,
    required this.titleKey,
    this.contentKey,
    this.actions,
    this.titleArgs,
    this.contentArgs,
  });

  @override
  Widget build(BuildContext context) {
    String title = titleKey.tr();
    String? content = contentKey?.tr();

    if (titleArgs != null) {
      for (final entry in titleArgs!.entries) {
        title = title.replaceAll('${entry.key}', entry.value);
      }
    }

    if (contentArgs != null && content != null) {
      for (final entry in contentArgs!.entries) {
        content = content!.replaceAll('${entry.key}', entry.value);
      }
    }

    return AlertDialog(
      title: Text(title),
      content: content != null ? Text(content) : null,
      actions: actions,
    );
  }
}

/// Localized snackbar with automatic translation
class LocalizedSnackBar {
  static void show({
    required BuildContext context,
    required String messageKey,
    Map<String, String>? args,
    Duration duration = const Duration(seconds: 3),
    SnackBarAction? action,
  }) {
    String message = messageKey.tr();

    if (args != null) {
      for (final entry in args!.entries) {
        message = message.replaceAll('${entry.key}', entry.value);
      }
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: duration,
        action: action,
      ),
    );
  }

  static void showSuccess({
    required BuildContext context,
    required String messageKey,
    Map<String, String>? args,
  }) {
    show(
      context: context,
      messageKey: messageKey,
      args: args,
      backgroundColor: Colors.green,
    );
  }

  static void showError({
    required BuildContext context,
    required String messageKey,
    Map<String, String>? args,
  }) {
    show(
      context: context,
      messageKey: messageKey,
      args: args,
      backgroundColor: Colors.red,
    );
  }

  static void showInfo({
    required BuildContext context,
    required String messageKey,
    Map<String, String>? args,
  }) {
    show(
      context: context,
      messageKey: messageKey,
      args: args,
      backgroundColor: Colors.blue,
    );
  }
}