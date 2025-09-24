import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'error_handler.dart';

/// Interface pour les stratégies de logging
abstract class LoggingStrategy {
  Future<void> log(LogLevel level, String message, {Map<String, dynamic>? context, StackTrace? stackTrace});
}

/// Stratégie de logging console
class ConsoleLoggingStrategy implements LoggingStrategy {
  final bool _enabled;
  final LogLevel _minLevel;

  ConsoleLoggingStrategy({bool enabled = true, LogLevel minLevel = LogLevel.debug})
      : _enabled = enabled,
        _minLevel = minLevel;

  @override
  Future<void> log(LogLevel level, String message, {Map<String, dynamic>? context, StackTrace? stackTrace}) async {
    if (!_enabled || level.index < _minLevel.index) return;

    final timestamp = DateTime.now().toIso8601String();
    final contextStr = context != null ? ' | Context: $context' : '';
    final fullMessage = '[$timestamp] $message$contextStr';

    switch (level) {
      case LogLevel.debug:
        developer.log(fullMessage, name: 'Logger');
        break;
      case LogLevel.info:
        developer.log(fullMessage, name: 'Logger');
        break;
      case LogLevel.warning:
        developer.log('⚠️ $fullMessage', name: 'Logger');
        break;
      case LogLevel.error:
        developer.log('❌ $fullMessage', name: 'Logger', stackTrace: stackTrace);
        break;
      case LogLevel.critical:
        developer.log('🚨 $fullMessage', name: 'Logger', stackTrace: stackTrace);
        break;
    }
  }
}

/// Stratégie de logging distant (Supabase)
class RemoteLoggingStrategy implements LoggingStrategy {
  final SupabaseClient _supabase;
  final bool _enabled;
  final LogLevel _minLevel;

  RemoteLoggingStrategy({
    SupabaseClient? supabase,
    bool enabled = true,
    LogLevel minLevel = LogLevel.warning,
  }) : _supabase = supabase ?? Supabase.instance.client,
       _enabled = enabled,
       _minLevel = minLevel;

  @override
  Future<void> log(LogLevel level, String message, {Map<String, dynamic>? context, StackTrace? stackTrace}) async {
    if (!_enabled || level.index < _minLevel.index) return;

    try {
      await _supabase.from('app_logs').insert({
        'level': level.name.toUpperCase(),
        'message': message,
        'context': context,
        'stack_trace': stackTrace?.toString(),
        'timestamp': DateTime.now().toIso8601String(),
        'user_id': _supabase.auth.currentUser?.id,
        'platform': _getPlatform(),
        'app_version': '1.0.0', // À récupérer depuis package_info_plus
      });
    } catch (e) {
      // Échec silencieux pour ne pas bloquer l'application
      if (kDebugMode) {
        developer.log('Failed to log remotely: $e', name: 'Logger');
      }
    }
  }

  String _getPlatform() {
    // À implémenter avec device_info_plus
    return 'unknown';
  }
}

/// Service de logging sécurisé
class SecureLogger {
  static final SecureLogger _instance = SecureLogger._internal();
  static SecureLogger get instance => _instance;
  SecureLogger._internal();

  final List<LoggingStrategy> _strategies = [];
  final ErrorHandler _errorHandler = ErrorHandler.instance;

  /// Configuration du logger
  void configure({
    bool enableConsole = true,
    LogLevel consoleMinLevel = LogLevel.debug,
    bool enableRemote = true,
    LogLevel remoteMinLevel = LogLevel.warning,
    SupabaseClient? supabase,
  }) {
    _strategies.clear();

    if (enableConsole) {
      _strategies.add(ConsoleLoggingStrategy(
        enabled: true,
        minLevel: consoleMinLevel,
      ));
    }

    if (enableRemote) {
      _strategies.add(RemoteLoggingStrategy(
        supabase: supabase,
        enabled: true,
        minLevel: remoteMinLevel,
      ));
    }
  }

  /// Logging d'un message
  Future<void> log(
    LogLevel level,
    String message, {
    Map<String, dynamic>? context,
    StackTrace? stackTrace,
    String? screen,
    String? action,
  }) async {
    try {
      // Filtrer les données sensibles
      final sanitizedContext = _sanitizeContext(context);
      final sanitizedMessage = _sanitizeMessage(message);

      for (final strategy in _strategies) {
        await strategy.log(level, sanitizedMessage, context: sanitizedContext, stackTrace: stackTrace);
      }
    } catch (e) {
      // Utiliser le ErrorHandler pour éviter les erreurs en cascade
      await _errorHandler.handleError(
        e,
        screen: screen ?? 'Logger',
        action: action ?? 'log_message',
        context: {'original_message': message},
      );
    }
  }

  /// Logging de debug
  Future<void> debug(String message, {Map<String, dynamic>? context, String? screen}) async {
    await log(LogLevel.debug, message, context: context, screen: screen);
  }

  /// Logging d'info
  Future<void> info(String message, {Map<String, dynamic>? context, String? screen}) async {
    await log(LogLevel.info, message, context: context, screen: screen);
  }

  /// Logging d'avertissement
  Future<void> warning(String message, {Map<String, dynamic>? context, String? screen}) async {
    await log(LogLevel.warning, message, context: context, screen: screen);
  }

  /// Logging d'erreur
  Future<void> error(String message, {Map<String, dynamic>? context, StackTrace? stackTrace, String? screen}) async {
    await log(LogLevel.error, message, context: context, stackTrace: stackTrace, screen: screen);
  }

  /// Logging critique
  Future<void> critical(String message, {Map<String, dynamic>? context, StackTrace? stackTrace, String? screen}) async {
    await log(LogLevel.critical, message, context: context, stackTrace: stackTrace, screen: screen);
  }

  /// Logging des actions utilisateur
  Future<void> logUserAction(
    String action, {
    Map<String, dynamic>? context,
    String? screen,
    String? userId,
  }) async {
    final enrichedContext = {
      'action_type': 'user_action',
      'user_id': userId,
      ...?context,
    };

    await info('User action: $action', context: enrichedContext, screen: screen);
  }

  /// Logging des performances
  Future<void> logPerformance(
    String operation,
    Duration duration, {
    Map<String, dynamic>? context,
    String? screen,
  }) async {
    final enrichedContext = {
      'operation': operation,
      'duration_ms': duration.inMilliseconds,
      'action_type': 'performance',
      ...?context,
    };

    await info('Performance: $operation took ${duration.inMilliseconds}ms',
      context: enrichedContext,
      screen: screen,
    );
  }

  /// Logging des événements réseau
  Future<void> logNetworkEvent(
    String url,
    String method,
    int? statusCode, {
    Map<String, dynamic>? context,
    String? screen,
  }) async {
    final enrichedContext = {
      'url': _sanitizeUrl(url),
      'method': method,
      'status_code': statusCode,
      'action_type': 'network',
      ...?context,
    };

    final level = (statusCode != null && statusCode >= 400) ? LogLevel.error : LogLevel.info;
    await log(level, 'Network: $method $url -> $statusCode',
      context: enrichedContext,
      screen: screen,
    );
  }

  /// Sanitisation du contexte pour éviter les fuites de données
  Map<String, dynamic>? _sanitizeContext(Map<String, dynamic>? context) {
    if (context == null) return null;

    final sensitiveKeys = {
      'password', 'token', 'secret', 'key', 'api_key', 'auth', 'credit_card',
      'ssn', 'social_security', 'phone', 'email', 'address'
    };

    return context.map((key, value) {
      if (sensitiveKeys.contains(key.toLowerCase())) {
        return MapEntry(key, '[REDACTED]');
      }
      return MapEntry(key, value);
    });
  }

  /// Sanitisation du message
  String _sanitizeMessage(String message) {
    // Supprimer les informations sensibles potentielles
    return message.replaceAll(RegExp(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b'), '[CARD]');
  }

  /// Sanitisation des URLs
  String _sanitizeUrl(String url) {
    // Supprimer les paramètres sensibles des URLs
    final uri = Uri.parse(url);
    final sanitizedQuery = Map<String, String>.from(uri.queryParameters);

    final sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
    for (final param in sensitiveParams) {
      sanitizedQuery.remove(param);
    }

    return uri.replace(query: sanitizedQuery.isEmpty ? null : Uri(queryParameters: sanitizedQuery).query).toString();
  }

  /// Débogage des actions asynchrones
  Future<T> traceAsync<T>(
    String operation,
    Future<T> Function() function, {
    Map<String, dynamic>? context,
    String? screen,
  }) async {
    final startTime = DateTime.now();

    try {
      final result = await function();
      final duration = DateTime.now().difference(startTime);

      await logPerformance(operation, duration, context: {
        'status': 'success',
        ...?context,
      }, screen: screen);

      return result;
    } catch (error, stackTrace) {
      final duration = DateTime.now().difference(startTime);

      await logPerformance(operation, duration, context: {
        'status': 'error',
        'error': error.toString(),
        ...?context,
      }, screen: screen);

      await _errorHandler.handleError(error, stackTrace: stackTrace, screen: screen, action: operation);

      rethrow;
    }
  }
}

/// Extensions pour faciliter le logging
extension LoggingExtensions on String {
  Future<void> logDebug({Map<String, dynamic>? context, String? screen}) async {
    await SecureLogger.instance.debug(this, context: context, screen: screen);
  }

  Future<void> logInfo({Map<String, dynamic>? context, String? screen}) async {
    await SecureLogger.instance.info(this, context: context, screen: screen);
  }

  Future<void> logWarning({Map<String, dynamic>? context, String? screen}) async {
    await SecureLogger.instance.warning(this, context: context, screen: screen);
  }

  Future<void> logError({Map<String, dynamic>? context, StackTrace? stackTrace, String? screen}) async {
    await SecureLogger.instance.error(this, context: context, stackTrace: stackTrace, screen: screen);
  }

  Future<void> logCritical({Map<String, dynamic>? context, StackTrace? stackTrace, String? screen}) async {
    await SecureLogger.instance.critical(this, context: context, stackTrace: stackTrace, screen: screen);
  }
}