// Public home screen
import 'package:flutter/material.dart';
import 'package:pharmaci/core/app/theme/app_theme.dart';
import 'package:pharmaci/core/app/routes/app_routes.dart';
import 'package:pharmaci/core/app/routes/app_routes.dart';
import 'package:pharmaci/presentation/widgets/drug/drug_search_bar.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PharmaCi'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              Navigator.pushNamed(context, '/login');
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Trouvez votre médicament',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Recherchez par nom de médicament ou molécule',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 32),
              const DrugSearchBar(),
              const SizedBox(height: 32),
              const Text(
                'Services',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              GridView.count(
                crossAxisCount: 3,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                shrinkWrap: true,
                children: [
                  _ServiceCard(
                    title: 'Pharmacies de garde',
                    icon: Icons.access_time,
                    color: Colors.orange,
                    onTap: () {},
                  ),
                  _ServiceCard(
                    title: 'Urgence',
                    icon: Icons.emergency,
                    color: Colors.red,
                    onTap: () {},
                  ),
                  _ServiceCard(
                    title: 'Mes réservations',
                    icon: Icons.bookmark,
                    color: Colors.blue,
                    onTap: () {},
                  ),
                  _ServiceCard(
                    title: 'Pharmaciens',
                    icon: Icons.medical_services,
                    color: Colors.green,
                    onTap: () {
                      Navigator.pushNamed(context, '/role-selection');
                    },
                  ),
                  _ServiceCard(
                    title: 'Test Supabase',
                    icon: Icons.cloud,
                    color: Colors.purple,
                    onTap: () {
                      Navigator.pushNamed(context, AppRoutes.findMedication);
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ServiceCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 48,
                color: color,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
