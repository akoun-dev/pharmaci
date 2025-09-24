import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../domain/entities/health_assistant_entity.dart';
import '../../core/config/env.dart';
import '../../core/validators/health_assistant_validator.dart';
import '../../core/utils/rate_limiter.dart';
import '../../core/exceptions/app_exceptions.dart';
import '../../core/auth/auth_guard.dart';

class HealthAssistantProvider with ChangeNotifier {
  final SupabaseClient _supabase = Supabase.instance.client;
  static const String _zaiApiUrl = Env.zaiApiUrl;
  static const String _zaiApiKey = Env.zaiApiKey;
  final RateLimiter _rateLimiter = RateLimiter(
    maxRequestsPerMinute: 30,
    maxRequestsPerHour: 300,
    maxRequestsPerDay: 1000,
  );
  final AuthGuard _authGuard = const AuthGuard(Supabase.instance.client);

  List<HealthAssistantEntity> _conversations = [];
  List<HealthAssistantEntity> _savedResponses = [];
  bool _isLoading = false;
  String? _errorMessage;
  bool _isListening = false;
  String? _lastQuery;

  List<HealthAssistantEntity> get conversations => _conversations;
  List<HealthAssistantEntity> get savedResponses => _savedResponses;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isListening => _isListening;
  String? get lastQuery => _lastQuery;

  Future<void> sendMessage({
    required String query,
    required String userId,
    HealthAssistantType type = HealthAssistantType.generalHealth,
  }) async {
    try {
      // Authentication check
      final currentUser = await _authGuard.getCurrentUser();

      // Verify user can access this data
      if (currentUser['id'] != userId && currentUser['role'] != 'admin') {
        throw ForbiddenException('You can only access your own health assistant data');
      }

      // Input validation
      HealthAssistantValidator.validateQuery(query);
      HealthAssistantValidator.validateUserId(userId);

      // Check API key availability
      if (_zaiApiKey.isEmpty) {
        throw MissingConfigurationException('ZAI_API_KEY');
      }

      // Rate limiting check
      if (!_rateLimiter.canMakeRequest(userId)) {
        final retryAfter = _rateLimiter.getTimeUntilNextRequest(userId);
        throw RateLimitExceededException(
          'Too many requests. Please wait before trying again.',
          retryAfter,
        );
      }

      _isLoading = true;
      _errorMessage = null;
      _lastQuery = query;
      notifyListeners();

      final response = await _getAIResponse(query, type);

      final conversation = HealthAssistantEntity(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: userId,
        query: query,
        response: response.response,
        createdAt: DateTime.now(),
        type: type,
        confidence: response.confidence,
      );

      _conversations.insert(0, conversation);

      await _saveToDatabase(conversation);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      final appException = ExceptionHelper.from(e);
      _errorMessage = ExceptionHelper.getUserMessage(appException);
      notifyListeners();
    }
  }

  Future<void> loadConversations(String userId) async {
    try {
      // Input validation
      HealthAssistantValidator.validateUserId(userId);

      _isLoading = true;
      notifyListeners();

      final response = await _supabase
          .from('health_assistant_conversations')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(50);

      _conversations = response
          .map((json) => HealthAssistantEntity.fromJson(json))
          .toList();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      final appException = ExceptionHelper.from(e);
      _errorMessage = ExceptionHelper.getUserMessage(appException);
      notifyListeners();
    }
  }

  Future<void> loadSavedResponses(String userId) async {
    try {
      // Input validation
      HealthAssistantValidator.validateUserId(userId);

      _isLoading = true;
      notifyListeners();

      final response = await _supabase
          .from('health_assistant_conversations')
          .select()
          .eq('user_id', userId)
          .eq('is_saved', true)
          .order('created_at', ascending: false);

      _savedResponses = response
          .map((json) => HealthAssistantEntity.fromJson(json))
          .toList();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      final appException = ExceptionHelper.from(e);
      _errorMessage = ExceptionHelper.getUserMessage(appException);
      notifyListeners();
    }
  }

  Future<void> saveResponse(String conversationId) async {
    try {
      await _supabase
          .from('health_assistant_conversations')
          .update({'is_saved': true})
          .eq('id', conversationId);

      final index = _conversations.indexWhere((c) => c.id == conversationId);
      if (index != -1) {
        _conversations[index] = _conversations[index].copyWith(isSaved: true);
        _savedResponses.add(_conversations[index]);
        notifyListeners();
      }
    } catch (e) {
      final appException = ExceptionHelper.from(e);
      _errorMessage = ExceptionHelper.getUserMessage(appException);
      notifyListeners();
    }
  }

  Future<void> unsaveResponse(String conversationId) async {
    try {
      await _supabase
          .from('health_assistant_conversations')
          .update({'is_saved': false})
          .eq('id', conversationId);

      _savedResponses.removeWhere((r) => r.id == conversationId);

      final index = _conversations.indexWhere((c) => c.id == conversationId);
      if (index != -1) {
        _conversations[index] = _conversations[index].copyWith(isSaved: false);
        notifyListeners();
      }
    } catch (e) {
      final appException = ExceptionHelper.from(e);
      _errorMessage = ExceptionHelper.getUserMessage(appException);
      notifyListeners();
    }
  }

  Future<void> deleteConversation(String conversationId) async {
    try {
      await _supabase
          .from('health_assistant_conversations')
          .delete()
          .eq('id', conversationId);

      _conversations.removeWhere((c) => c.id == conversationId);
      _savedResponses.removeWhere((r) => r.id == conversationId);
      notifyListeners();
    } catch (e) {
      final appException = ExceptionHelper.from(e);
      _errorMessage = ExceptionHelper.getUserMessage(appException);
      notifyListeners();
    }
  }

  Future<void> clearHistory(String userId) async {
    try {
      await _supabase
          .from('health_assistant_conversations')
          .delete()
          .eq('user_id', userId);

      _conversations.clear();
      _savedResponses.clear();
      notifyListeners();
    } catch (e) {
      final appException = ExceptionHelper.from(e);
      _errorMessage = ExceptionHelper.getUserMessage(appException);
      notifyListeners();
    }
  }

  void setListening(bool listening) {
    _isListening = listening;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  Future<AIResponse> _getAIResponse(String query, HealthAssistantType type) async {
    try {
      final systemPrompt = _getSystemPromptForType(type);

      final response = await http.post(
        Uri.parse(_zaiApiUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_zaiApiKey',
        },
        body: jsonEncode({
          'model': 'claude-3-sonnet-20240229',
          'max_tokens': 1000,
          'system': systemPrompt,
          'messages': [
            {
              'role': 'user',
              'content': query,
            }
          ],
        }),
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        final aiResponse = responseData['content'][0]['text'];

        return AIResponse(
          response: aiResponse,
          confidence: _calculateConfidenceScore(query, type),
        );
      } else {
        throw Exception('Erreur API Z.ai: ${response.statusCode}');
      }
    } catch (e) {
      print('Erreur lors de l\'appel à Z.ai: $e');
      return await _getFallbackResponse(type);
    }
  }

  String _getSystemPromptForType(HealthAssistantType type) {
    switch (type) {
      case HealthAssistantType.drugInformation:
        return '''Vous êtes un assistant pharmaceutique spécialisé en informations sur les médicaments.
        Fournissez des informations précises sur les médicaments, leurs utilisations, effets secondaires,
        et précautions. Soulignez toujours que ces informations sont générales et ne remplacent pas
        l'avis d'un professionnel de santé. Soyez concis et informatif.''';

      case HealthAssistantType.symptomChecker:
        return '''Vous êtes un assistant médical spécialisé dans l'analyse des symptômes.
        Aidez les utilisateurs à comprendre leurs symptômes possibles, mais insistez toujours sur
        la nécessité de consulter un médecin pour un diagnostic précis. Ne donnez jamais de
        diagnostic définitif. Fournissez des informations générales sur les symptômes.''';

      case HealthAssistantType.dosageAdvice:
        return '''Vous êtes un assistant pharmaceutique spécialisé dans les conseils de posologie.
        Fournissez des informations générales sur les dosages habituels des médicaments,
        mais insistez toujours sur l'importance de suivre les prescriptions du médecin et
        les recommandations du pharmacien. Mentionnez que les dosages peuvent varier selon
        l'âge, le poids et l'état de santé.''';

      case HealthAssistantType.interactionWarning:
        return '''Vous êtes un spécialiste des interactions médicamenteuses.
        Fournissez des informations sur les interactions potentielles entre médicaments,
        aliments, et plantes médicinales. Insistez sur l'importance d'informer tous les
        professionnels de santé de tous les médicaments pris. Soyez précis et prudent.''';

      case HealthAssistantType.emergencyGuidance:
        return '''Vous êtes un assistant médical d'urgence.
        Fournissez des conseils d'urgence clairs et précis. En cas d'urgence réelle,
        insistez sur la nécessité de contacter immédiatement les services d'urgence (144)
        ou de se rendre à l'hôpital le plus proche. Soyez direct et pratique.''';

      case HealthAssistantType.generalHealth:
        return '''Vous êtes un assistant de santé général.
        Fournissez des informations générales sur la santé, le bien-être et la prévention.
        Encouragez les pratiques saines et la consultation régulière de professionnels de santé.
        Soyez informatif et encourageant, mais donnez toujours des conseils généraux.''';
    }
  }

  double _calculateConfidenceScore(String query, HealthAssistantType type) {
    if (query.toLowerCase().contains('urgence') || query.toLowerCase().contains('urgence')) {
      return 0.95;
    }

    if (query.length < 10) {
      return 0.70;
    }

    if (query.contains('?')) {
      return 0.85;
    }

    return 0.80;
  }

  Future<AIResponse> _getFallbackResponse(HealthAssistantType type) async {
    final fallbackResponses = {
      HealthAssistantType.drugInformation: {
        'response': 'Je ne peux pas accéder à ma base de données médicale actuellement. Pour des informations précises sur les médicaments, veuillez consulter un pharmacien ou un médecin.',
        'confidence': 0.70,
      },
      HealthAssistantType.symptomChecker: {
        'response': 'Je rencontre des difficultés techniques. Pour l\'évaluation de vos symptômes, il est recommandé de consulter un professionnel de santé.',
        'confidence': 0.65,
      },
      HealthAssistantType.dosageAdvice: {
        'response': 'Pour des conseils de dosage précis, veuillez consulter votre médecin ou votre pharmacien. Ils pourront vous donner des recommandations adaptées à votre situation.',
        'confidence': 0.75,
      },
      HealthAssistantType.interactionWarning: {
        'response': 'Pour vérifier les interactions médicamenteuses, informez toujours votre médecin et votre pharmacien de tous les médicaments que vous prenez.',
        'confidence': 0.80,
      },
      HealthAssistantType.generalHealth: {
        'response': 'Je rencontre actuellement des difficultés techniques. Pour des conseils de santé personnalisés, veuillez consulter un professionnel de santé.',
        'confidence': 0.70,
      },
      HealthAssistantType.emergencyGuidance: {
        'response': 'En cas d\'urgence médicale, contactez immédiatement le 144 ou rendez-vous à l\'hôpital le plus proche. Ne tardez pas.',
        'confidence': 0.95,
      },
    };

    final response = fallbackResponses[type] ?? fallbackResponses[HealthAssistantType.generalHealth]!;

    return AIResponse(
      response: response['response'] as String,
      confidence: response['confidence'] as double,
    );
  }

  Future<void> _saveToDatabase(HealthAssistantEntity conversation) async {
    try {
      // Use transaction for data consistency
      await _supabase.rpc('save_conversation_transaction', params: {
        'p_conversation_data': conversation.toJson(),
      });
    } catch (e) {
      // Fallback to direct insert if RPC not available
      try {
        await _supabase.from('health_assistant_conversations').insert(conversation.toJson());
      } catch (fallbackError) {
        throw DatabaseException(
          'Failed to save conversation to database',
          'SAVE_CONVERSATION_FAILED',
          fallbackError,
        );
      }
    }
  }
}

class AIResponse {
  final String response;
  final double confidence;

  AIResponse({
    required this.response,
    required this.confidence,
  });
}