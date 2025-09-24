import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../domain/entities/health_assistant_entity.dart';
import '../../../providers/health_assistant_provider.dart';

class MessageBubble extends StatelessWidget {
  final HealthAssistantEntity conversation;
  final VoidCallback onSave;
  final VoidCallback onUnsave;
  final VoidCallback onDelete;

  const MessageBubble({
    super.key,
    required this.conversation,
    required this.onSave,
    required this.onUnsave,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildUserMessage(),
          const SizedBox(height: 8),
          _buildAIResponse(),
        ],
      ),
    );
  }

  Widget _buildUserMessage() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.blue[100],
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            conversation.query,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _formatTime(conversation.createdAt),
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAIResponse() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: Colors.green[100],
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(
            Icons.health_and_safety,
            color: Colors.green,
            size: 20,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  conversation.response,
                  style: const TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (conversation.confidence != null) ...[
                      Icon(
                        Icons.security,
                        size: 14,
                        color: _getConfidenceColor(conversation.confidence!),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Fiabilité: ${(conversation.confidence! * 100).toStringAsFixed(0)}%',
                        style: TextStyle(
                          fontSize: 12,
                          color: _getConfidenceColor(conversation.confidence!),
                        ),
                      ),
                      const Spacer(),
                    ],
                    _buildTypeIcon(),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(
                        conversation.isSaved
                            ? Icons.bookmark
                            : Icons.bookmark_border,
                        color: conversation.isSaved ? Colors.orange : Colors.grey,
                        size: 20,
                      ),
                      onPressed: conversation.isSaved ? onUnsave : onSave,
                      visualDensity: VisualDensity.compact,
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.delete_outline,
                        color: Colors.red,
                        size: 20,
                      ),
                      onPressed: onDelete,
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTypeIcon() {
    IconData icon;
    Color color;

    switch (conversation.type) {
      case HealthAssistantType.drugInformation:
        icon = Icons.medication;
        color = Colors.blue;
        break;
      case HealthAssistantType.symptomChecker:
        icon = Icons.sick;
        color = Colors.red;
        break;
      case HealthAssistantType.dosageAdvice:
        icon = Icons.scale;
        color = Colors.purple;
        break;
      case HealthAssistantType.interactionWarning:
        icon = Icons.warning;
        color = Colors.orange;
        break;
      case HealthAssistantType.emergencyGuidance:
        icon = Icons.emergency;
        color = Colors.red;
        break;
      case HealthAssistantType.generalHealth:
        icon = Icons.health_and_safety;
        color = Colors.green;
        break;
    }

    return Icon(
      icon,
      size: 16,
      color: color,
    );
  }

  Color _getConfidenceColor(double confidence) {
    if (confidence >= 0.8) return Colors.green;
    if (confidence >= 0.6) return Colors.orange;
    return Colors.red;
  }

  String _formatTime(DateTime date) {
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}