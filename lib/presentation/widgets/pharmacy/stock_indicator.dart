// Pharmacy stock availability indicator
import 'package:flutter/material.dart';

class StockIndicator extends StatelessWidget {
  final String status;
  final int count;

  const StockIndicator({
    super.key,
    required this.status,
    required this.count,
  });

  @override
  Widget build(BuildContext context) {
    Color color = _getStatusColor(status);

    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '$status ($count)',
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'disponible':
        return Colors.green;
      case 'limité':
        return Colors.orange;
      case 'rupture':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
