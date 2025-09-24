import 'package:flutter/material.dart';
import 'package:pharmaci/presentation/providers/auth_provider.dart';

class AuthGuard {
  static Widget requireAuth({
    required Widget child,
    required BuildContext context,
  }) {
    final authProvider = AuthProvider();

    if (!authProvider.isAuthenticated) {
      return const LoginScreen();
    }

    return child;
  }

  static Widget requireRole({
    required Widget child,
    required BuildContext context,
    required String requiredRole,
  }) {
    final authProvider = AuthProvider();

    if (!authProvider.isAuthenticated) {
      return const LoginScreen();
    }

    if (authProvider.userProfile?.role != requiredRole) {
      return const UnauthorizedScreen();
    }

    return child;
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock, size: 80, color: Colors.grey),
            const SizedBox(height: 20),
            const Text(
              'Authentication Required',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            const Text(
              'Please sign in to access this feature',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: () {
                Navigator.pushReplacementNamed(context, '/auth/login');
              },
              child: const Text('Sign In'),
            ),
          ],
        ),
      ),
    );
  }
}

class UnauthorizedScreen extends StatelessWidget {
  const UnauthorizedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.no_accounts, size: 80, color: Colors.red),
            const SizedBox(height: 20),
            const Text(
              'Access Denied',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            const Text(
              'You don\'t have permission to access this feature',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }
}
