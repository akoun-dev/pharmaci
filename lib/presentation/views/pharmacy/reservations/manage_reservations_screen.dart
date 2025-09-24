// Manage Reservations screen (pharmacist-facing)
import 'package:flutter/material.dart';
import 'package:pharmaci/core/app/theme/colors.dart';
import 'package:pharmaci/core/services/supabase_service.dart';
import 'package:pharmaci/core/config/env.dart';

class ManageReservationsScreen extends StatefulWidget {
  const ManageReservationsScreen({super.key});

  @override
  State<ManageReservationsScreen> createState() => _ManageReservationsScreenState();
}

class _ManageReservationsScreenState extends State<ManageReservationsScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _reservations = const [];

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final pharmacyId = Env.demoPharmacyId;
      if (pharmacyId.isEmpty) {
        setState(() {
          _loading = false;
          _reservations = const [];
        });
        return;
      }
      final res = await SupabaseService.instance.getPharmacyReservations(pharmacyId);
      setState(() {
        _loading = false;
        _reservations = res;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _updateStatus(String id, String status) async {
    final ok = await SupabaseService.instance.updateReservationStatus(reservationId: id, status: status);
    if (ok) _fetch();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manage Reservations')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('Erreur: $_error'))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _reservations.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    final r = _reservations[i];
                    final id = r['id'].toString();
                    final title = r['drugs']?['name'] ?? 'Medication';
                    final qty = r['quantity'] ?? 0;
                    final userId = r['user_id'];
                    final status = (r['status'] ?? 'pending') as String;
                    final subtitle = 'Quantity: $qty\nUser: $userId\nCode: ${id.substring(0,6).toUpperCase()}';
                    final color = status == 'ready'
                        ? AppColors.green
                        : status == 'cancelled'
                            ? AppColors.error
                            : status == 'picked'
                                ? AppColors.gray500
                                : AppColors.orange;
                    final statusText = status == 'ready'
                        ? 'Ready for Pickup'
                        : status == 'picked'
                            ? 'Picked up'
                            : status == 'cancelled'
                                ? 'Cancelled'
                                : 'Pending';
                    return _ReservationCard(
                      title: title,
                      subtitle: subtitle,
                      statusText: statusText,
                      statusColor: color,
                      showPrimary: status == 'pending' || status == 'ready',
                      primaryLabel: status == 'pending' ? 'Mark as Ready' : 'Picked Up',
                      onPrimary: () => _updateStatus(id, status == 'pending' ? 'ready' : 'picked'),
                      onCancel: () => _updateStatus(id, 'cancelled'),
                    );
                  },
                ),
    );
  }
}

class _ReservationCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String statusText;
  final Color statusColor;
  final bool showPrimary;
  final String primaryLabel;

  final VoidCallback? onPrimary;
  final VoidCallback? onCancel;

  const _ReservationCard({
    required this.title,
    required this.subtitle,
    required this.statusText,
    required this.statusColor,
    required this.showPrimary,
    required this.primaryLabel,
    this.onPrimary,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 6),
                    Text(statusText, style: TextStyle(color: statusColor)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(subtitle),
            const SizedBox(height: 12),
            Row(
              children: [
                if (showPrimary)
                  Expanded(
                    child: ElevatedButton(
                      onPressed: onPrimary,
                      child: Text(primaryLabel),
                    ),
                  ),
                if (showPrimary) const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: onCancel,
                    child: const Text('Cancel'),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
