// Public main shell with bottom navigation (Search, Pharmacies, Account)
import 'package:flutter/material.dart';
import 'package:pharmaci/core/app/theme/colors.dart';
import 'package:pharmaci/core/app/routes/app_routes.dart';
import 'package:pharmaci/presentation/views/public/find_medication_screen.dart';
import 'package:pharmaci/presentation/views/account/account_screen.dart';

class PublicMainShell extends StatefulWidget {
  const PublicMainShell({super.key});

  @override
  State<PublicMainShell> createState() => _PublicMainShellState();
}

class _PublicMainShellState extends State<PublicMainShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      const FindMedicationScreen(),
      const _PharmaciesTab(),
      const AccountScreen(),
    ];

    return Scaffold(
      body: SafeArea(child: pages[_index]),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            label: 'Search',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_pharmacy_outlined),
            label: 'Pharmacies',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Account',
          ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: _index == 0
          ? null
          : FloatingActionButton.extended(
              backgroundColor: AppColors.orange,
              foregroundColor: Colors.white,
              onPressed: () => Navigator.pushNamed(
                context,
                AppRoutes.findMedication,
              ),
              label: const Text('Search Medication'),
              icon: const Icon(Icons.search),
            ),
    );
  }
}

class _PharmaciesTab extends StatelessWidget {
  const _PharmaciesTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pharmacies')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 6,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          return Card(
            child: ListTile(
              leading: const Icon(Icons.local_pharmacy),
              title: Text('Pharmacie ${index + 1}'),
              subtitle: const Text('Abidjan, Côte d\'Ivoire'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
            ),
          );
        },
      ),
    );
  }
}

