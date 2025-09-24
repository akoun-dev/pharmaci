import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../domain/entities/review_entity.dart';

class ReviewCard extends StatelessWidget {
  final ReviewEntity review;
  final VoidCallback onHelpful;
  final VoidCallback onReport;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const ReviewCard({
    super.key,
    required this.review,
    required this.onHelpful,
    required this.onReport,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 12),
            _buildRating(),
            const SizedBox(height: 12),
            _buildComment(),
            if (review.pros.isNotEmpty || review.cons.isNotEmpty) ...[
              const SizedBox(height: 12),
              _buildProsCons(),
            ],
            const SizedBox(height: 12),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        CircleAvatar(
          backgroundColor: Colors.grey[300],
          child: Icon(
            review.isAnonymous ? Icons.person_outline : Icons.person,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                review.isAnonymous ? 'Anonyme' : 'Utilisateur',
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                DateFormat('dd/MM/yyyy').format(review.createdAt),
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        if (review.isVerified)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.verified, color: Colors.green, size: 14),
                SizedBox(width: 4),
                Text(
                  'Vérifié',
                  style: TextStyle(
                    color: Colors.green,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        PopupMenuButton<String>(
          onSelected: (value) {
            switch (value) {
              case 'edit':
                onEdit();
                break;
              case 'delete':
                onDelete();
                break;
              case 'report':
                onReport();
                break;
            }
          },
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'edit',
              child: Row(
                children: [
                  Icon(Icons.edit),
                  SizedBox(width: 8),
                  Text('Modifier'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(
                children: [
                  Icon(Icons.delete),
                  SizedBox(width: 8),
                  Text('Supprimer'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'report',
              child: Row(
                children: [
                  Icon(Icons.flag),
                  SizedBox(width: 8),
                  Text('Signaler'),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRating() {
    return Row(
      children: [
        Row(
          children: List.generate(5, (index) {
            return Icon(
              index < review.rating.floor() ? Icons.star : Icons.star_border,
              color: Colors.amber,
              size: 16,
            );
          }),
        ),
        const SizedBox(width: 8),
        Text(
          review.rating.toStringAsFixed(1),
          style: const TextStyle(
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildComment() {
    return Text(
      review.comment,
      style: const TextStyle(fontSize: 16),
    );
  }

  Widget _buildProsCons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (review.pros.isNotEmpty) ...[
          Row(
            children: [
              const Icon(Icons.thumb_up, color: Colors.green, size: 16),
              const SizedBox(width: 8),
              Text(
                'Points forts:',
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  color: Colors.green[700],
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: review.pros.map((pro) {
              return Chip(
                label: Text(pro),
                backgroundColor: Colors.green.withOpacity(0.1),
                labelStyle: TextStyle(color: Colors.green[700]),
                visualDensity: VisualDensity.compact,
              );
            }).toList(),
          ),
        ],
        if (review.cons.isNotEmpty) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.thumb_down, color: Colors.red, size: 16),
              const SizedBox(width: 8),
              Text(
                'Points faibles:',
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  color: Colors.red[700],
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: review.cons.map((con) {
              return Chip(
                label: Text(con),
                backgroundColor: Colors.red.withOpacity(0.1),
                labelStyle: TextStyle(color: Colors.red[700]),
                visualDensity: VisualDensity.compact,
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildFooter() {
    return Row(
      children: [
        TextButton.icon(
          onPressed: onHelpful,
          icon: const Icon(Icons.thumb_up_outlined, size: 16),
          label: Text('Utile (${review.helpfulCount})'),
          style: TextButton.styleFrom(
            padding: EdgeInsets.zero,
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
        const SizedBox(width: 16),
        TextButton.icon(
          onPressed: onReport,
          icon: const Icon(Icons.flag_outlined, size: 16),
          label: const Text('Signaler'),
          style: TextButton.styleFrom(
            padding: EdgeInsets.zero,
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
      ],
    );
  }
}