// Role selection screen (Patient/Pharmacist)
import 'package:flutter/material.dart';

class RoleSelection extends StatelessWidget {
  const RoleSelection({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sélection du rôle')),
      body: const Center(
        child: Text('Sélection Patient/Pharmacien'),
      ),
    );
  }
}
