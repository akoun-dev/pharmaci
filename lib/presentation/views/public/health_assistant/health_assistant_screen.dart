import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import '../../../providers/health_assistant_provider.dart';
import '../../../providers/auth_provider.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart';
import '../../widgets/health_assistant/message_bubble.dart';
import '../../widgets/health_assistant/voice_input_button.dart';
import '../../widgets/health_assistant/quick_actions_grid.dart';

class HealthAssistantScreen extends StatefulWidget {
  const HealthAssistantScreen({super.key});

  @override
  State<HealthAssistantScreen> createState() => _HealthAssistantScreenState();
}

class _HealthAssistantScreenState extends State<HealthAssistantScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadUserConversations();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadUserConversations() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final healthAssistantProvider = Provider.of<HealthAssistantProvider>(context, listen: false);

    if (authProvider.user != null) {
      await healthAssistantProvider.loadConversations(authProvider.user!.id);
      await healthAssistantProvider.loadSavedResponses(authProvider.user!.id);
    }
  }

  void _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;

    final message = _messageController.text;
    _messageController.clear();

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user != null) {
      await Provider.of<HealthAssistantProvider>(context, listen: false).sendMessage(
        query: message,
        userId: authProvider.user!.id,
      );

      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.minScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Assistant IA de Santé'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () => _showHistoryDialog(),
          ),
          IconButton(
            icon: const Icon(Icons.bookmark),
            onPressed: () => _showSavedResponses(),
          ),
        ],
      ),
      body: Consumer<HealthAssistantProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.conversations.isEmpty) {
            return const LoadingWidget();
          }

          if (provider.errorMessage != null) {
            return CustomErrorWidget(
              message: provider.errorMessage!,
              onRetry: _loadUserConversations,
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  controller: _scrollController,
                  reverse: true,
                  padding: const EdgeInsets.all(16),
                  itemCount: provider.conversations.length,
                  itemBuilder: (context, index) {
                    final conversation = provider.conversations[index];
                    return MessageBubble(
                      conversation: conversation,
                      onSave: () => provider.saveResponse(conversation.id),
                      onUnsave: () => provider.unsaveResponse(conversation.id),
                      onDelete: () => provider.deleteConversation(conversation.id),
                    );
                  },
                ),
              ),
              if (provider.isLoading && provider.conversations.isNotEmpty)
                const Padding(
                  padding: EdgeInsets.all(8.0),
                  child: Center(
                    child: CircularProgressIndicator(),
                  ),
                ),
              _buildInputArea(provider),
            ],
          );
        },
      ),
    );
  }

  Widget _buildInputArea(HealthAssistantProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        children: [
          if (provider.conversations.isEmpty) ...[
            const Text(
              'Bonjour ! Je suis votre assistant santé. Comment puis-je vous aider ?',
              style: TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            const QuickActionsGrid(),
            const SizedBox(height: 16),
          ],
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  decoration: InputDecoration(
                    hintText: 'Tapez votre question...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
              const SizedBox(width: 8),
              VoiceInputButton(
                isListening: provider.isListening,
                onPressed: () => _handleVoiceInput(provider),
              ),
              const SizedBox(width: 8),
              FloatingActionButton(
                onPressed: provider.isLoading ? null : _sendMessage,
                child: provider.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation(Colors.white),
                        ),
                      )
                    : const Icon(Icons.send),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _handleVoiceInput(HealthAssistantProvider provider) async {
    if (provider.isListening) {
      provider.setListening(false);
      return;
    }

    provider.setListening(true);

    await Future.delayed(const Duration(seconds: 3));

    if (mounted) {
      _messageController.text = provider.lastQuery ?? 'Symptômes de la grippe';
      provider.setListening(false);
    }
  }

  void _showHistoryDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Historique des conversations'),
        content: SizedBox(
          width: double.maxFinite,
          height: 300,
          child: Consumer<HealthAssistantProvider>(
            builder: (context, provider, child) {
              if (provider.conversations.isEmpty) {
                return const Center(child: Text('Aucune conversation'));
              }

              return ListView.builder(
                itemCount: provider.conversations.length,
                itemBuilder: (context, index) {
                  final conversation = provider.conversations[index];
                  return ListTile(
                    title: Text(
                      conversation.query,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      _formatDate(conversation.createdAt),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    onTap: () {
                      Navigator.pop(context);
                    },
                  );
                },
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              if (authProvider.user != null) {
                await Provider.of<HealthAssistantProvider>(context, listen: false)
                    .clearHistory(authProvider.user!.id);
                Navigator.pop(context);
              }
            },
            child: const Text('Effacer tout'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }

  void _showSavedResponses() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const SavedResponsesScreen(),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        return 'Il y a ${difference.inMinutes} min';
      }
      return 'Il y a ${difference.inHours} h';
    } else if (difference.inDays == 1) {
      return 'Hier';
    } else if (difference.inDays < 7) {
      return 'Il y a ${difference.inDays} jours';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

class SavedResponsesScreen extends StatelessWidget {
  const SavedResponsesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Réponses sauvegardées'),
      ),
      body: Consumer<HealthAssistantProvider>(
        builder: (context, provider, child) {
          if (provider.savedResponses.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.bookmark_border, size: 64),
                  SizedBox(height: 16),
                  Text('Aucune réponse sauvegardée'),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.savedResponses.length,
            itemBuilder: (context, index) {
              final conversation = provider.savedResponses[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        conversation.query,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        conversation.response,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _formatDate(conversation.createdAt),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Aujourd\'hui à ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Hier à ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } else {
      return '${date.day}/${date.month}/${date.year} à ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    }
  }
}