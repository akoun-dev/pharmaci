// Pharmacy main shell with bottom navigation: Stock, Reservations, Account
import 'package:flutter/material.dart';
import 'package:pharmaci/presentation/views/pharmacy/inventory/inventory_list.dart';
import 'package:pharmaci/presentation/views/pharmacy/reservations/manage_reservations_screen.dart';
import 'package:pharmaci/presentation/views/account/account_screen.dart';

class PharmacyMainShell extends StatefulWidget {
  const PharmacyMainShell({super.key});

  @override
  State<PharmacyMainShell> createState() => _PharmacyMainShellState();
}

class _PharmacyMainShellState extends State<PharmacyMainShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      const InventoryList(),
      const ManageReservationsScreen(),
      const AccountScreen(),
    ];

    return Scaffold(
      body: SafeArea(child: pages[_index]),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            label: 'Stock',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            label: 'Reservations',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}

