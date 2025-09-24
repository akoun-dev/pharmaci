// Account screen per mockup
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pharmaci/core/app/theme/colors.dart';
import 'package:pharmaci/core/app/theme/text_styles.dart';
import 'package:pharmaci/presentation/providers/auth_provider.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final user = authProvider.userProfile;

        return Scaffold(
          appBar: AppBar(title: const Text('Account')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const SizedBox(height: 16),
              Center(
                child: Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    CircleAvatar(
                      radius: 48,
                      backgroundColor: AppColors.surfaceAlt,
                      child: Text(
                        user?.fullName.isNotEmpty == true
                            ? '${user!.firstName[0]}${user.lastName[0]}'
                            : 'U',
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                      ),
                    ),
                    Container(
                      decoration: const BoxDecoration(
                        color: AppColors.orange,
                        shape: BoxShape.circle,
                      ),
                      padding: const EdgeInsets.all(6),
                      child: const Icon(Icons.edit, color: Colors.white, size: 16),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                user?.fullName ?? 'User',
                style: AppTextStyles.titleL,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                user?.email ?? 'user@example.com',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              Text('Settings', style: AppTextStyles.titleM),
              const SizedBox(height: 12),
              _tile(
                icon: Icons.notifications_none,
                title: 'Notifications',
                trailing: Switch(value: true, onChanged: (_) {}),
              ),
              const SizedBox(height: 8),
              _tile(
                icon: Icons.language,
                title: 'Language',
                subtitle: 'French',
              ),
              const SizedBox(height: 8),
              _tile(
                icon: Icons.brightness_6_outlined,
                title: 'Theme',
                subtitle: 'Light',
              ),
              const SizedBox(height: 24),
              Text('Account', style: AppTextStyles.titleM),
              const SizedBox(height: 12),
              _tile(
                icon: Icons.lock_outline,
                title: 'Change Password',
                onTap: () => _showChangePasswordDialog(context, authProvider),
              ),
              const SizedBox(height: 8),
              _tile(
                icon: Icons.logout,
                title: 'Sign Out',
                iconColor: Colors.red,
                onTap: () => _showSignOutDialog(context, authProvider),
              ),
              const SizedBox(height: 24),
              Text('Support', style: AppTextStyles.titleM),
              const SizedBox(height: 12),
              _tile(icon: Icons.help_outline, title: 'Help Center', trailing: const Icon(Icons.chevron_right)),
              const SizedBox(height: 8),
              _tile(icon: Icons.mail_outline, title: 'Contact Us', trailing: const Icon(Icons.chevron_right)),
            ],
          ),
        );
      },
    );
  }

  void _showChangePasswordDialog(BuildContext context, AuthProvider authProvider) {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Current Password',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: newPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'New Password',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: confirmPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Confirm New Password',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (newPasswordController.text != confirmPasswordController.text) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Passwords do not match')),
                );
                return;
              }

              final success = await authProvider.updatePassword(
                currentPassword: currentPasswordController.text,
                newPassword: newPasswordController.text,
              );

              if (success) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Password updated successfully')),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(authProvider.error ?? 'Failed to update password')),
                );
              }
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  void _showSignOutDialog(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              await authProvider.signOut();
              Navigator.pop(context);
              Navigator.pushReplacementNamed(context, '/auth/login');
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  Widget _tile({
  required IconData icon,
  required String title,
  String? subtitle,
  Widget? trailing,
  Color? iconColor,
  VoidCallback? onTap,
}) {
    return Card(
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.gray200,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: iconColor ?? AppColors.gray700),
        ),
        title: Text(title, style: AppTextStyles.bodyL.copyWith(fontWeight: FontWeight.w700)),
        subtitle: subtitle != null ? Text(subtitle) : null,
        trailing: trailing,
        onTap: onTap ?? () {},
      ),
    );
  }
}

