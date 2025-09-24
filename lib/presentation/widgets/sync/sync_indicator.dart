// Data synchronization indicator
import 'package:flutter/material.dart';

enum SyncStatus {
  synced,
  syncing,
  error,
  offline,
}

class SyncIndicator extends StatelessWidget {
  final SyncStatus status;
  final DateTime? lastSync;
  final VoidCallback? onPressed;

  const SyncIndicator({
    super.key,
    required this.status,
    this.lastSync,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: _getStatusColor().withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _getStatusColor().withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _getStatusIcon(),
              size: 16,
              color: _getStatusColor(),
            ),
            const SizedBox(width: 6),
            Text(
              _getStatusText(),
              style: TextStyle(
                fontSize: 12,
                color: _getStatusColor(),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor() {
    switch (status) {
      case SyncStatus.synced:
        return Colors.green;
      case SyncStatus.syncing:
        return Colors.blue;
      case SyncStatus.error:
        return Colors.red;
      case SyncStatus.offline:
        return Colors.orange;
    }
  }

  IconData _getStatusIcon() {
    switch (status) {
      case SyncStatus.synced:
        return Icons.check_circle;
      case SyncStatus.syncing:
        return Icons.sync;
      case SyncStatus.error:
        return Icons.error;
      case SyncStatus.offline:
        return Icons.cloud_off;
    }
  }

  String _getStatusText() {
    switch (status) {
      case SyncStatus.synced:
        if (lastSync != null) {
          final now = DateTime.now();
          final difference = now.difference(lastSync!);

          if (difference.inMinutes < 1) {
            return 'Sync. maintenant';
          } else if (difference.inMinutes < 60) {
            return 'Sync. il y a ${difference.inMinutes} min';
          } else if (difference.inHours < 24) {
            return 'Sync. il y a ${difference.inHours}h';
          } else {
            return 'Sync. le ${lastSync!.day}/${lastSync!.month}';
          }
        }
        return 'Synchronisé';
      case SyncStatus.syncing:
        return 'Synchronisation...';
      case SyncStatus.error:
        return 'Erreur de sync.';
      case SyncStatus.offline:
        return 'Hors ligne';
    }
  }
}
