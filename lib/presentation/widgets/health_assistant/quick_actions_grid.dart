import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/health_assistant_provider.dart';
import '../../../providers/auth_provider.dart';

class QuickActionsGrid extends StatelessWidget {
  const QuickActionsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.2,
      children: [
        _buildActionCard(
          context: context,
          icon: Icons.medication,
          title: 'Informations médicaments',
          subtitle: 'Posologie, effets secondaires',
          color: Colors.blue,
          type: HealthAssistantType.drugInformation,
        ),
        _buildActionCard(
          context: context,
          icon: Icons.sick,
          title: 'Vérifier symptômes',
          subtitle: 'Analyse de symptômes',
          color: Colors.red,
          type: HealthAssistantType.symptomChecker,
        ),
        _buildActionCard(
          context: context,
          icon: Icons.scale,
          title: 'Conseils posologie',
          subtitle: 'Dosage et fréquence',
          color: Colors.purple,
          type: HealthAssistantType.dosageAdvice,
        ),
        _buildActionCard(
          context: context,
          icon: Icons.warning,
          title: 'Interactions',
          subtitle: 'Interactions médicamenteuses',
          color: Colors.orange,
          type: HealthAssistantType.interactionWarning,
        ),
      ],
    );
  }

  Widget _buildActionCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required HealthAssistantType type,
  }) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: () => _handleQuickAction(context, type),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 24,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleQuickAction(BuildContext context, HealthAssistantType type) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final healthAssistantProvider = Provider.of<HealthAssistantProvider>(context, listen: false);

    if (authProvider.user != null) {
      String query = '';
      switch (type) {
        case HealthAssistantType.drugInformation:
          query = 'Informations sur les médicaments courants';
          break;
        case HealthAssistantType.symptomChecker:
          query = 'Comment reconnaître les symptômes de la grippe ?';
          break;
        case HealthAssistantType.dosageAdvice:
          query = 'Conseils pour prendre correctement mes médicaments';
          break;
        case HealthAssistantType.interactionWarning:
          query = 'Vérifier les interactions entre médicaments';
          break;
        default:
          query = 'Conseils santé généraux';
      }

      await healthAssistantProvider.sendMessage(
        query: query,
        userId: authProvider.user!.id,
        type: type,
      );
    }
  }
}