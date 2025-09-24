// Medication Details screen showing available quantity and pharmacies in stock
import 'package:flutter/material.dart';
import 'package:pharmaci/core/app/theme/colors.dart';
import 'package:pharmaci/core/app/theme/text_styles.dart';
import 'package:pharmaci/core/app/routes/app_routes.dart';
import 'package:pharmaci/core/services/supabase_service.dart';

class MedicationDetailsScreen extends StatefulWidget {
  const MedicationDetailsScreen({super.key});

  @override
  State<MedicationDetailsScreen> createState() => _MedicationDetailsScreenState();
}

class _MedicationDetailsScreenState extends State<MedicationDetailsScreen> {
  final List<Map<String, dynamic>> _stocks = [];
  String _drugName = '';
  String? _drugId;
  bool _loading = true;
  String? _error;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final arg = ModalRoute.of(context)?.settings.arguments as String?;
    _drugName = arg ?? 'Paracetamol 500mg';
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // Search stocks for the given drug query
      final service = SupabaseService.instance;
      final results = await service.searchDrugsInPharmacies(drugQuery: _drugName);
      if (results.isNotEmpty) {
        _drugId = results.first['drugs']['id']?.toString();
      }
      setState(() {
        _loading = false;
        _stocks
          ..clear()
          ..addAll(results);
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _reserve(Map<String, dynamic> row) async {
    final service = SupabaseService.instance;
    final user = await service.getCurrentUser();
    if (user == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Connectez-vous pour réserver.')),
      );
      return;
    }
    final pharmacyId = row['pharmacies']?['id']?.toString() ?? row['pharmacy_id']?.toString();
    final drugId = row['drugs']?['id']?.toString() ?? _drugId;
    if (pharmacyId == null || drugId == null) return;

    final created = await service.createReservation(
      userId: user['id'],
      pharmacyId: pharmacyId,
      drugId: drugId,
      quantity: 1,
    );
    if (!mounted) return;
    Navigator.pushNamed(
      context,
      AppRoutes.reservationConfirmation,
      arguments: created,
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalQty = _stocks.fold<int>(0, (sum, r) => sum + (r['quantity'] ?? 0));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Medication Details'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('Erreur: $_error'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _InfoBlock(
                      label: 'Medication Name',
                      child: Text(_drugName, style: AppTextStyles.titleL),
                    ),
                    const SizedBox(height: 12),
                    _InfoBlock(
                      label: 'Available Quantity',
                      child: Text('$totalQty units', style: AppTextStyles.titleL),
                    ),
                    const SizedBox(height: 24),
                    Text('Pharmacies in Stock', style: AppTextStyles.titleL),
                    const SizedBox(height: 12),
                    if (_stocks.isEmpty)
                      const Text('Aucune pharmacie trouvée', style: TextStyle(color: AppColors.gray700))
                    else
                      ..._stocks.map((row) => _PharmacyItem(
                            title: row['pharmacies']?['name'] ?? 'Pharmacy',
                            address: row['pharmacies']?['address'] ?? 'Abidjan',
                            updatedAgo: row['last_updated'] ?? row['updated_at'] ?? '',
                            onReserve: () => _reserve(row),
                          )),
                  ],
                ),
    );
  }
}

class _InfoBlock extends StatelessWidget {
  final String label;
  final Widget child;
  const _InfoBlock({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: AppColors.orange, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _PharmacyItem extends StatelessWidget {
  final String title;
  final String address;
  final Object? updatedAgo;
  final VoidCallback onReserve;
  const _PharmacyItem({required this.title, required this.address, required this.updatedAgo, required this.onReserve});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        child: ListTile(
          title: Text(title, style: AppTextStyles.titleM),
          subtitle: Text(address),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text('Updated recently', style: TextStyle(color: AppColors.gray500)),
              const SizedBox(height: 8),
              SizedBox(
                height: 34,
                child: ElevatedButton(
                  onPressed: onReserve,
                  child: const Text('Reserve'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
