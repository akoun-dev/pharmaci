// Reservation Confirmation screen and success dialog style
import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:pharmaci/core/app/theme/colors.dart';
import 'package:pharmaci/core/app/theme/text_styles.dart';

class ReservationConfirmationScreen extends StatelessWidget {
  const ReservationConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final Map<String, dynamic>? reservation =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final code = reservation?['id']?.toString().substring(0, 6).toUpperCase() ?? '123456';
    final pharmacyName = reservation?['pharmacies']?['name'] ?? 'Pharmacie de la Rivière, Abidjan';
    final drugName = reservation?['drugs']?['name'] ?? 'Paracetamol - 2 tablets';

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Reservation Confirmation'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.center,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle, size: 56, color: AppColors.orange),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Your medication is reserved!',
            style: AppTextStyles.titleL,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Please pick up your medication within the specified timeframe to ensure availability.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          _DetailCard(
            pharmacy: pharmacyName,
            medication: drugName,
            code: code,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => _showDoneDialog(context),
            child: const Text('Add to Calendar'),
          ),
        ],
      ),
    );
  }

  void _showDoneDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        return Dialog(
          insetPadding: const EdgeInsets.all(24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle, size: 64, color: AppColors.green),
                const SizedBox(height: 12),
                Text('Reservation Confirmed!', style: AppTextStyles.titleL),
                const SizedBox(height: 8),
                const Text(
                  'Your medication is reserved at Pharmacie de la Riviera.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                DottedBorder(
                  color: AppColors.orange,
                  strokeWidth: 2,
                  borderType: BorderType.RRect,
                  radius: const Radius.circular(12),
                  dashPattern: const [6, 4],
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    color: const Color(0xFFFFF3E7),
                    child: Column(
                      children: [
                        const Text('Your Reservation Code', style: TextStyle(color: AppColors.orange, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        Text('ABJ-$code', style: AppTextStyles.titleL.copyWith(fontSize: 28, color: AppColors.orange)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.gray200,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Pickup Timeframe', style: TextStyle(fontWeight: FontWeight.w700)),
                      SizedBox(height: 4),
                      Text('Please pick up within the next 24 hours.'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Done'),
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }
}

class _DetailCard extends StatelessWidget {
  final String medication;
  final String pharmacy;
  final String code;

  const _DetailCard({required this.medication, required this.pharmacy, required this.code});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _row('Medication', medication),
            const Divider(height: 28),
            _row('Pharmacy', pharmacy),
            const Divider(height: 28),
            _row('Pickup Time', 'Today, 10:00 AM - 12:00 PM', highlight: true),
            const Divider(height: 28),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your Reservation Code', style: TextStyle(color: AppColors.gray700)),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.gray200,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      code,
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(String title, String value, {bool highlight = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: AppColors.gray700)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: highlight ? AppColors.surfaceAlt : AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(value, style: AppTextStyles.bodyL.copyWith(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
