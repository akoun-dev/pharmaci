import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../../core/utils/error_handler.dart';
import '../../core/utils/logger.dart';
import '../../core/exceptions/app_exceptions.dart';

/// Configuration réseau
class NetworkConfig {
  static const Duration defaultTimeout = Duration(seconds: 30);
  static const int maxRetries = 3;
  static const Duration retryDelay = Duration(seconds: 1);
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/// Événement réseau
class NetworkEvent {
  final String url;
  final String method;
  final int? statusCode;
  final Duration duration;
  final Map<String, dynamic>? context;
  final DateTime timestamp;

  NetworkEvent({
    required this.url,
    required this.method,
    this.statusCode,
    required this.duration,
    this.context,
    required this.timestamp,
  });
}

/// Gestionnaire réseau avec retry et logging
class NetworkManager {
  static final NetworkManager _instance = NetworkManager._internal();
  static NetworkManager get instance => _instance;
  NetworkManager._internal();

  final StreamController<NetworkEvent> _networkStream = StreamController.broadcast();
  final Map<String, DateTime> _lastRequestTime = {};
  final Map<String, int> _requestCounts = {};

  Stream<NetworkEvent> get networkStream => _networkStream.stream;

  /// Configuration du client HTTP
  http.Client createClient({
    Duration? timeout,
    Map<String, String>? headers,
  }) {
    return _RetryClient(
      timeout: timeout ?? NetworkConfig.defaultTimeout,
      headers: {...NetworkConfig.defaultHeaders, ...?headers},
    );
  }

  /// Requête HTTP avec gestion d'erreurs et retry
  Future<http.Response> request(
    String url, {
    required String method,
    Map<String, String>? headers,
    dynamic body,
    int? maxRetries,
    Duration? timeout,
    Map<String, dynamic>? context,
  }) async {
    final startTime = DateTime.now();
    final sanitizedUrl = _sanitizeUrl(url);
    final client = createClient(timeout: timeout, headers: headers);

    try {
      await SecureLogger.instance.info('Network request started',
        context: {
          'url': sanitizedUrl,
          'method': method,
          ...?context,
        },
        screen: 'NetworkManager',
      );

      // Rate limiting
      if (_shouldRateLimit(sanitizedUrl)) {
        throw RateLimitExceededException('Too many requests to $sanitizedUrl');
      }

      final request = http.Request(method, Uri.parse(url));
      request.headers.addAll(headers ?? {});

      if (body != null) {
        if (body is String) {
          request.body = body;
        } else if (body is Map) {
          request.body = body.toString();
        }
      }

      final response = await client.send(request);

      final streamedResponse = await http.Response.fromStream(response);
      final duration = DateTime.now().difference(startTime);

      // Logging de l'événement réseau
      final networkEvent = NetworkEvent(
        url: sanitizedUrl,
        method: method,
        statusCode: streamedResponse.statusCode,
        duration: duration,
        context: context,
        timestamp: DateTime.now(),
      );

      _networkStream.add(networkEvent);
      await _logNetworkEvent(networkEvent);

      // Gestion des réponses d'erreur
      if (streamedResponse.statusCode >= 400) {
        throw _handleErrorResponse(streamedResponse);
      }

      return streamedResponse;
    } catch (error, stackTrace) {
      final duration = DateTime.now().difference(startTime);

      await SecureLogger.instance.error('Network request failed',
        context: {
          'url': sanitizedUrl,
          'method': method,
          'error': error.toString(),
          'duration_ms': duration.inMilliseconds,
          ...?context,
        },
        screen: 'NetworkManager',
      );

      await ErrorHandler.instance.handleError(
        error,
        stackTrace: stackTrace,
        screen: 'NetworkManager',
        action: 'request',
        context: {
          'url': sanitizedUrl,
          'method': method,
          ...?context,
        },
      );

      rethrow;
    } finally {
      client.close();
    }
  }

  /// GET request
  Future<http.Response> get(
    String url, {
    Map<String, String>? headers,
    int? maxRetries,
    Duration? timeout,
    Map<String, dynamic>? context,
  }) async {
    return request(
      url,
      method: 'GET',
      headers: headers,
      maxRetries: maxRetries,
      timeout: timeout,
      context: context,
    );
  }

  /// POST request
  Future<http.Response> post(
    String url, {
    Map<String, String>? headers,
    dynamic body,
    int? maxRetries,
    Duration? timeout,
    Map<String, dynamic>? context,
  }) async {
    return request(
      url,
      method: 'POST',
      headers: headers,
      body: body,
      maxRetries: maxRetries,
      timeout: timeout,
      context: context,
    );
  }

  /// PUT request
  Future<http.Response> put(
    String url, {
    Map<String, String>? headers,
    dynamic body,
    int? maxRetries,
    Duration? timeout,
    Map<String, dynamic>? context,
  }) async {
    return request(
      url,
      method: 'PUT',
      headers: headers,
      body: body,
      maxRetries: maxRetries,
      timeout: timeout,
      context: context,
    );
  }

  /// DELETE request
  Future<http.Response> delete(
    String url, {
    Map<String, String>? headers,
    int? maxRetries,
    Duration? timeout,
    Map<String, dynamic>? context,
  }) async {
    return request(
      url,
      method: 'DELETE',
      headers: headers,
      maxRetries: maxRetries,
      timeout: timeout,
      context: context,
    );
  }

  /// Vérifie la connectivité réseau
  Future<bool> checkConnectivity() async {
    try {
      final response = await http.get(
        Uri.parse('https://www.google.com'),
        headers: {'User-Agent': 'Mozilla/5.0'},
      ).timeout(const Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      await SecureLogger.instance.warning('Network connectivity check failed',
        context: {'error': e.toString()},
        screen: 'NetworkManager',
      );
      return false;
    }
  }

  /// Vérifie si une requête doit être rate limitée
  bool _shouldRateLimit(String url) {
    final now = DateTime.now();
    final lastRequest = _lastRequestTime[url];

    if (lastRequest != null && now.difference(lastRequest) < const Duration(milliseconds: 100)) {
      return true;
    }

    _lastRequestTime[url] = now;
    _requestCounts[url] = (_requestCounts[url] ?? 0) + 1;

    return false;
  }

  /// Sanitise l'URL pour le logging
  String _sanitizeUrl(String url) {
    final uri = Uri.parse(url);
    final sanitizedQuery = Map<String, String>.from(uri.queryParameters);

    final sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
    for (final param in sensitiveParams) {
      sanitizedQuery.remove(param);
    }

    return uri.replace(query: sanitizedQuery.isEmpty ? null : Uri(queryParameters: sanitizedQuery).query).toString();
  }

  /// Gère les réponses d'erreur
  AppException _handleErrorResponse(http.Response response) {
    switch (response.statusCode) {
      case 400:
        return ValidationException('Bad request: ${response.body}');
      case 401:
        return UnauthorizedException('Unauthorized access');
      case 403:
        return ForbiddenException('Access forbidden');
      case 404:
        return NotFoundException('Resource not found');
      case 429:
        final retryAfter = int.tryParse(response.headers['retry-after'] ?? '0') ?? 0;
        return RateLimitExceededException('Rate limit exceeded', retryAfter: retryAfter);
      case 500:
        return ServerErrorException('Internal server error');
      case 502:
      case 503:
      case 504:
        return ServerErrorException('Service unavailable');
      default:
        return ApiException('HTTP ${response.statusCode}: ${response.body}',
          statusCode: response.statusCode,
        );
    }
  }

  /// Logging des événements réseau
  Future<void> _logNetworkEvent(NetworkEvent event) async {
    await SecureLogger.instance.logNetworkEvent(
      event.url,
      event.method,
      event.statusCode,
      context: event.context,
      screen: 'NetworkManager',
    );
  }

  /// Nettoyage des ressources
  void dispose() {
    _networkStream.close();
  }
}

/// Client HTTP avec retry intégré
class _RetryClient extends http.BaseClient {
  final http.Client _inner;
  final Duration timeout;
  final Map<String, String> headers;
  final int maxRetries;
  final Duration retryDelay;

  _RetryClient({
    http.Client? inner,
    required this.timeout,
    required this.headers,
  })  : maxRetries = NetworkConfig.maxRetries,
        retryDelay = NetworkConfig.retryDelay,
        _inner = inner ?? http.Client();

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    request.headers.addAll(headers);

    for (int attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        final response = await _inner
          .send(request)
          .timeout(timeout);

        // Ne pas retry les erreurs client
        if (response.statusCode >= 400 && response.statusCode < 500) {
          return response;
        }

        return response;
      } on SocketException catch (e) {
        if (attempt == maxRetries) {
          throw ConnectionException('Network connection failed: ${e.message}');
        }
        await Future.delayed(retryDelay);
      } on TimeoutException {
        if (attempt == maxRetries) {
          rethrow;
        }
        await Future.delayed(retryDelay);
      } on HttpException catch (e) {
        if (attempt == maxRetries) {
          throw ConnectionException('HTTP error: ${e.message}');
        }
        await Future.delayed(retryDelay);
      }
    }

    throw NetworkException('Max retries exceeded');
  }

  @override
  void close() {
    _inner.close();
  }
}

/// Extensions pour faciliter les requêtes réseau
extension NetworkExtensions on String {
  Future<http.Response> httpGet({
    Map<String, String>? headers,
    Map<String, dynamic>? context,
  }) async {
    return NetworkManager.instance.get(
      this,
      headers: headers,
      context: context,
    );
  }

  Future<http.Response> httpPost({
    Map<String, String>? headers,
    dynamic body,
    Map<String, dynamic>? context,
  }) async {
    return NetworkManager.instance.post(
      this,
      headers: headers,
      body: body,
      context: context,
    );
  }

  Future<http.Response> httpPut({
    Map<String, String>? headers,
    dynamic body,
    Map<String, dynamic>? context,
  }) async {
    return NetworkManager.instance.put(
      this,
      headers: headers,
      body: body,
      context: context,
    );
  }

  Future<http.Response> httpDelete({
    Map<String, String>? headers,
    Map<String, dynamic>? context,
  }) async {
    return NetworkManager.instance.delete(
      this,
      headers: headers,
      context: context,
    );
  }
}