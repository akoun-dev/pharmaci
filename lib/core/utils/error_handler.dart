import 'dart:async';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../exceptions/app_exceptions.dart';

/// Niveaux de logging
enum LogLevel {
  debug,
  info,
  warning,
  error,
  critical,
}

/// Événement d'erreur
class ErrorEvent {
  final String errorId;
  final AppException exception;
  final StackTrace? stackTrace;
  final DateTime timestamp;
  final Map<String, dynamic>? context;
  final String? screen;
  final String? action;

  ErrorEvent({
    required this.errorId,
    required this.exception,
    this.stackTrace,
    required this.timestamp,
    this.context,
    this.screen,
    this.action,
  });
}

/// Classe centralisée pour la gestion des erreurs et le logging sécurisé
class ErrorHandler {
  static final ErrorHandler _instance = ErrorHandler._internal();
  static ErrorHandler get instance => _instance;
  ErrorHandler._internal();

  final SupabaseClient _supabase = Supabase.instance.client;
  final StreamController<ErrorEvent> _errorStream = StreamController.broadcast();
  final Map<String, int> _errorCounts = {};
  final Map<String, DateTime> _lastErrorTime = {};

  /// Stream pour écouter les erreurs en temps réel
  Stream<ErrorEvent> get errorStream => _errorStream.stream;

  /// Configuration du logging
  bool _enableConsoleLogging = kDebugMode;
  bool _enableRemoteLogging = true;
  LogLevel _minLogLevel = LogLevel.info;
  int _maxErrorCount = 100;
  Duration _errorThrottle = const Duration(seconds: 5);

  /// Configure le gestionnaire d'erreurs
  void configure({
    bool? enableConsoleLogging,
    bool? enableRemoteLogging,
    LogLevel? minLogLevel,
    int? maxErrorCount,
    Duration? errorThrottle,
  }) {
    _enableConsoleLogging = enableConsoleLogging ?? _enableConsoleLogging;
    _enableRemoteLogging = enableRemoteLogging ?? _enableRemoteLogging;
    _minLogLevel = minLogLevel ?? _minLogLevel;
    _maxErrorCount = maxErrorCount ?? _maxErrorCount;
    _errorThrottle = errorThrottle ?? _errorThrottle;
  }

  /// Gère une erreur de manière sécurisée
  Future<void> handleError(
    dynamic error, {
    StackTrace? stackTrace,
    Map<String, dynamic>? context,
    String? screen,
    String? action,
    bool shouldRethrow = false,
  }) async {
    try {
      final AppException exception = _normalizeError(error);
      final String errorId = _generateErrorId(exception);

      // Vérification du throttling
      if (_shouldThrottleError(errorId)) {
        return;
      }

      final errorEvent = ErrorEvent(
        errorId: errorId,
        exception: exception,
        stackTrace: stackTrace,
        timestamp: DateTime.now(),
        context: context,
        screen: screen,
        action: action,
      );

      // Logging sécurisé
      await _logError(errorEvent);

      // Notification du stream
      _errorStream.add(errorEvent);

      // Nettoyage si trop d'erreurs
      _cleanupErrorCounts();

      if (shouldRethrow) {
        throw exception;
      }
    } catch (e) {
      // Éviter les erreurs dans le gestionnaire d'erreurs
      if (kDebugMode) {
        developer.log('Error in error handler: $e', name: 'ErrorHandler');
      }
    }
  }

  /// Exécute une fonction avec gestion d'erreurs
  Future<T> safeExecute<T>(
    Future<T> Function() function, {
    String? screen,
    String? action,
    Map<String, dynamic>? context,
    T? defaultValue,
  }) async {
    try {
      return await function();
    } catch (error, stackTrace) {
      await handleError(
        error,
        stackTrace: stackTrace,
        screen: screen,
        action: action,
        context: context,
      );
      return defaultValue ?? (throw error);
    }
  }

  /// Normalise une erreur en AppException
  AppException _normalizeError(dynamic error) {
    if (error is AppException) {
      return error;
    }
    return ExceptionHelper.from(error);
  }

  /// Génère un ID unique pour l'erreur
  String _generateErrorId(AppException exception) {
    final type = exception.runtimeType.toString();
    final code = exception.code ?? 'UNKNOWN';
    return '${type}_${code}_${DateTime.now().millisecondsSinceEpoch}';
  }

  /// Vérifie si l'erreur doit être throttled
  bool _shouldThrottleError(String errorId) {
    final now = DateTime.now();
    final lastTime = _lastErrorTime[errorId];

    if (lastTime != null && now.difference(lastTime) < _errorThrottle) {
      return true;
    }

    _lastErrorTime[errorId] = now;
    _errorCounts[errorId] = (_errorCounts[errorId] ?? 0) + 1;

    return false;
  }

  /// Nettoie les compteurs d'erreurs
  void _cleanupErrorCounts() {
    if (_errorCounts.length > _maxErrorCount) {
      final sorted = _errorCounts.entries.toList()
        ..sort((a, b) => _lastErrorTime[a.key]?.compareTo(_lastErrorTime[b.key] ?? DateTime.now()) ?? 0);

      final toRemove = sorted.take(_errorCounts.length - _maxErrorCount);
      for (final entry in toRemove) {
        _errorCounts.remove(entry.key);
        _lastErrorTime.remove(entry.key);
      }
    }
  }

  /// Logging sécurisé de l'erreur
  Future<void> _logError(ErrorEvent errorEvent) async {
    // Console logging (uniquement en debug)
    if (_enableConsoleLogging) {
      _logToConsole(errorEvent);
    }

    // Remote logging
    if (_enableRemoteLogging) {
      await _logToRemote(errorEvent);
    }
  }

  /// Logging vers la console
  void _logToConsole(ErrorEvent errorEvent) {
    final logLevel = _determineLogLevel(errorEvent.exception);

    if (!_shouldLog(logLevel)) {
      return;
    }

    final message = _formatLogMessage(errorEvent);

    switch (logLevel) {
      case LogLevel.debug:
        developer.log(message, name: 'ErrorHandler');
        break;
      case LogLevel.info:
        developer.log(message, name: 'ErrorHandler');
        break;
      case LogLevel.warning:
        developer.log('⚠️ $message', name: 'ErrorHandler');
        break;
      case LogLevel.error:
        developer.log('❌ $message', name: 'ErrorHandler', error: errorEvent.exception, stackTrace: errorEvent.stackTrace);
        break;
      case LogLevel.critical:
        developer.log('🚨 $message', name: 'ErrorHandler', error: errorEvent.exception, stackTrace: errorEvent.stackTrace);
        break;
    }
  }

  /// Logging vers Supabase
  Future<void> _logToRemote(ErrorEvent errorEvent) async {
    try {
      await _supabase.from('error_logs').insert({
        'error_id': errorEvent.errorId,
        'error_type': errorEvent.exception.runtimeType.toString(),
        'error_code': errorEvent.exception.code,
        'error_message': errorEvent.exception.message,
        'stack_trace': errorEvent.stackTrace?.toString(),
        'timestamp': errorEvent.timestamp.toIso8601String(),
        'screen': errorEvent.screen,
        'action': errorEvent.action,
        'context': errorEvent.context,
        'user_id': _supabase.auth.currentUser?.id,
        'app_version': '1.0.0', // À récupérer depuis package_info
        'platform': _getPlatform(),
      });
    } catch (e) {
      // Échec du logging distant - ne pas bloquer l'application
      if (kDebugMode) {
        developer.log('Failed to log error remotely: $e', name: 'ErrorHandler');
      }
    }
  }

  /// Détermine le niveau de logging
  LogLevel _determineLogLevel(AppException exception) {
    if (exception is AuthenticationException ||
        exception is ForbiddenException) {
      return LogLevel.warning;
    }

    if (exception is NetworkException ||
        exception is TimeoutException) {
      return LogLevel.warning;
    }

    if (exception is ServerErrorException ||
        exception is DatabaseException) {
      return LogLevel.error;
    }

    if (exception is BusinessException && exception.message.contains('critical')) {
      return LogLevel.critical;
    }

    return LogLevel.error;
  }

  /// Vérifie si le niveau de logging permet le log
  bool _shouldLog(LogLevel level) {
    return level.index >= _minLogLevel.index;
  }

  /// Formate le message de log
  String _formatLogMessage(ErrorEvent errorEvent) {
    final buffer = StringBuffer();
    buffer.writeln('[${errorEvent.timestamp.toIso8601String()}]');
    buffer.writeln('Error: ${errorEvent.exception}');

    if (errorEvent.screen != null) {
      buffer.writeln('Screen: ${errorEvent.screen}');
    }

    if (errorEvent.action != null) {
      buffer.writeln('Action: ${errorEvent.action}');
    }

    if (errorEvent.context != null) {
      buffer.writeln('Context: ${errorEvent.context}');
    }

    return buffer.toString().trim();
  }

  /// Récupère la plateforme actuelle
  String _getPlatform() {
    // À implémenter avec package_info_plus
    return 'unknown';
  }

  /// Déconnecte le gestionnaire d'erreurs
  void dispose() {
    _errorStream.close();
  }
}

/// Extension pour faciliter l'utilisation du gestionnaire d'erreurs
extension ErrorHandlerExtension on Future {
  Future<T> handleError<T>({
    String? screen,
    String? action,
    Map<String, dynamic>? context,
    T? defaultValue,
  }) async {
    return ErrorHandler.instance.safeExecute(
      () => this as Future<T>,
      screen: screen,
      action: action,
      context: context,
      defaultValue: defaultValue,
    );
  }
}

/// Extension pour les fonctions synchrones
extension SyncErrorHandlerExtension on Function {
  T handleError<T>({
    String? screen,
    String? action,
    Map<String, dynamic>? context,
    T? defaultValue,
  }) {
    try {
      return this() as T;
    } catch (error, stackTrace) {
      ErrorHandler.instance.handleError(
        error,
        stackTrace: stackTrace,
        screen: screen,
        action: action,
        context: context,
      );
      return defaultValue ?? (throw error);
    }
  }
}