// Update Stock screen
import 'package:flutter/material.dart';
import 'package:pharmaci/core/app/theme/colors.dart';

class UpdateStockScreen extends StatelessWidget {
  const UpdateStockScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final nameController = TextEditingController();
    final qtyController = TextEditingController();
    return Scaffold(
      appBar: AppBar(title: const Text('Update Stock')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            const Text('Medication Name'),
            const SizedBox(height: 8),
            TextField(
              controller: nameController,
              decoration: const InputDecoration(hintText: 'e.g., Paracetamol 500mg'),
            ),
            const SizedBox(height: 20),
            const Text('Quantity Available'),
            const SizedBox(height: 8),
            TextField(
              controller: qtyController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: 'e.g., 50'),
            ),
            const SizedBox(height: 24),
            const Spacer(),
            Text(
              'Last Updated: 2024-01-20 14:30',
              style: const TextStyle(color: AppColors.gray500),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {},
                child: const Text('Save Changes'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

