// Alerts and notifications panel
import 'package:flutter/material.dart';

class AlertsPanel extends StatelessWidget {
  const AlertsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Alertes',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: [
              _buildAlertItem(
                Icons.warning,
                'Stock bas',
                '3 médicaments en stock faible',
                Colors.orange,
              ),
              const Divider(),
              _buildAlertItem(
                Icons.schedule,
                'Expiration',
                '5 médicaments expirent ce mois',
                Colors.red,
              ),
              const Divider(),
              _buildAlertItem(
                Icons.sync_problem,
                'Synchronisation',
                'Dernière sync il y a 2 heures',
                Colors.blue,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAlertItem(
    IconData icon,
    String title,
    String subtitle,
    Color color,
  ) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: Icon(Icons.chevron_right, color: Colors.grey[400]),
      onTap: () {},
    );
  }
}
