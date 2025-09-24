import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../utils/error_handler.dart';
import '../utils/logger.dart';
import '../exceptions/app_exceptions.dart';

class MockSupabaseClient extends Mock implements SupabaseClient {}

class MockUser extends Mock implements User {}

void main() {
  group('ErrorHandler Tests', () {
    late ErrorHandler errorHandler;
    late MockSupabaseClient mockSupabase;

    setUp(() {
      mockSupabase = MockSupabaseClient();
      errorHandler = ErrorHandler();
    });

    tearDown(() {
      errorHandler.dispose();
    });

    test('should normalize AppException correctly', () {
      final appException = NetworkException('Network error');
      final normalized = errorHandler._normalizeError(appException);

      expect(normalized, same(appException));
    });

    test('should normalize generic exception to AppException', () {
      final genericException = Exception('Generic error');
      final normalized = errorHandler._normalizeError(genericException);

      expect(normalized, isA<AppException>());
      expect(normalized.message, contains('Generic error'));
    });

    test('should generate unique error ID', () {
      final exception = NetworkException('Test error', 'TEST_CODE');
      final errorId1 = errorHandler._generateErrorId(exception);
      final errorId2 = errorHandler._generateErrorId(exception);

      expect(errorId1, isNot(equals(errorId2)));
      expect(errorId1, contains('NetworkException'));
      expect(errorId1, contains('TEST_CODE'));
    });

    test('should throttle repeated errors', () async {
      final exception = NetworkException('Test error');
      final errorId = errorHandler._generateErrorId(exception);

      // First call should not be throttled
      expect(errorHandler._shouldThrottleError(errorId), isFalse);

      // Immediate second call should be throttled
      expect(errorHandler._shouldThrottleError(errorId), isTrue);
    });

    test('should handle error without crashing', () async {
      await errorHandler.handleError(
        Exception('Test error'),
        screen: 'TestScreen',
        action: 'testAction',
      );

      // Should not throw exception
      expect(true, isTrue);
    });

    test('should log error with context', () async {
      final errorStream = errorHandler.errorStream;
      final errorEvents = <ErrorEvent>[];

      final subscription = errorStream.listen((event) {
        errorEvents.add(event);
      });

      await errorHandler.handleError(
        NetworkException('Test error'),
        context: {'key': 'value'},
        screen: 'TestScreen',
      );

      expect(errorEvents, hasLength(1));
      expect(errorEvents.first.exception, isA<NetworkException>());
      expect(errorEvents.first.context, containsPair('key', 'value'));
      expect(errorEvents.first.screen, equals('TestScreen'));

      await subscription.cancel();
    });
  });

  group('SecureLogger Tests', () {
    late SecureLogger logger;

    setUp(() {
      logger = SecureLogger();
      logger.configure(enableConsole: true, enableRemote: false);
    });

    test('should sanitize sensitive data in context', () {
      final sensitiveContext = {
        'password': 'secret123',
        'token': 'abc123',
        'normal_data': 'value',
      };

      final sanitized = logger._sanitizeContext(sensitiveContext);

      expect(sanitized!['password'], equals('[REDACTED]'));
      expect(sanitized['token'], equals('[REDACTED]'));
      expect(sanitized['normal_data'], equals('value'));
    });

    test('should sanitize URLs', () {
      final urlWithSecret = 'https://api.example.com/data?token=secret123&key=hidden';
      final sanitized = logger._sanitizeUrl(urlWithSecret);

      expect(sanitized, isNot(contains('secret123')));
      expect(sanitized, isNot(contains('hidden')));
      expect(sanitized, contains('api.example.com'));
    });

    test('should sanitize credit card numbers in messages', () {
      final messageWithCard = 'Card number: 4111-1111-1111-1111';
      final sanitized = logger._sanitizeMessage(messageWithCard);

      expect(sanitized, contains('[CARD]'));
      expect(sanitized, isNot(contains('4111')));
    });
  });

  group('ExceptionHelper Tests', () {
    test('should convert SocketException to ConnectionException', () {
      final socketException = Exception('SocketException: Connection failed');
      final appException = ExceptionHelper.from(socketException);

      expect(appException, isA<ConnectionException>());
    });

    test('should convert 401 error to UnauthorizedException', () {
      final authError = Exception('Unauthorized access - 401');
      final appException = ExceptionHelper.from(authError);

      expect(appException, isA<UnauthorizedException>());
    });

    test('should convert 404 error to NotFoundException', () {
      final notFoundError = Exception('NotFound - 404');
      final appException = ExceptionHelper.from(notFoundError);

      expect(appException, isA<NotFoundException>());
    });

    test('should get user-friendly message for NetworkException', () {
      final exception = NetworkException('Network error');
      final userMessage = ExceptionHelper.getUserMessage(exception);

      expect(userMessage, contains('connexion'));
      expect(userMessage, contains('internet'));
    });

    test('should get user-friendly message for AuthenticationException', () {
      final exception = AuthenticationException('Auth failed');
      final userMessage = ExceptionHelper.getUserMessage(exception);

      expect(userMessage, contains('non autorisé'));
      expect(userMessage, contains('reconnecter'));
    });
  });
}