// Distance display badge widget
import 'package:flutter/material.dart';

class DistanceBadge extends StatelessWidget {
  final String distance;

  const DistanceBadge({
    super.key,
    required this.distance,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.directions_walk,
            size: 14,
            color: Colors.blue[600],
          ),
          const SizedBox(width: 4),
          Text(
            distance,
            style: TextStyle(
              color: Colors.blue[600],
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
