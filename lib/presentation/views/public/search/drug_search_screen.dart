// Drug search interface
import 'package:flutter/material.dart';

class DrugSearchScreen extends StatelessWidget {
  const DrugSearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recherche de médicaments')),
      body: const Center(
        child: Text('Recherche de médicaments'),
      ),
    );
  }
}
