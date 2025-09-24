# Gestion des Erreurs et Logging Sécurisé

## Overview

Ce document décrit le système de gestion des erreurs et de logging sécurisé implémenté dans l'application PharmaCi.

## Fonctionnalités

### 1. ErrorHandler Centralisé

Le `ErrorHandler` fournit une gestion centralisée des erreurs avec les fonctionnalités suivantes :

- **Normalisation des erreurs** : Conversion de toutes les exceptions en `AppException`
- **Logging sécurisé** : Envoi des erreurs vers la console et/ou Supabase
- **Throttling** : Évite les logs d'erreurs répétitifs
- **Contexte enrichi** : Capture d'informations contextuelles pour le débogage
- **Stream d'erreurs** : Écoute en temps réel des erreurs

### 2. Logging Sécurisé

Le `SecureLogger` implémente un système de logging sécurisé avec :

- **Sanitisation des données sensibles** : Masquage automatique des informations confidentielles
- **Niveaux de logging** : Debug, Info, Warning, Error, Critical
- **Stratégies configurables** : Console et/ou logging distant
- **Performance tracking** : Monitoring des temps d'exécution
- **Network event logging** : Suivi des requêtes réseau

### 3. Network Manager

Le `NetworkManager` fournit une gestion réseau robuste avec :

- **Retry automatique** : Tentatives multiples en cas d'échec
- **Timeout configurable** : Gestion des délais d'attente
- **Rate limiting** : Protection contre les requêtes excessives
- **Logging réseau** : Suivi détaillé des appels API
- **Gestion centralisée des erreurs réseau**

## Utilisation

### ErrorHandler

```dart
// Configuration
ErrorHandler.instance.configure(
  enableConsoleLogging: true,
  enableRemoteLogging: true,
  minLogLevel: LogLevel.info,
  maxErrorCount: 100,
  errorThrottle: Duration(seconds: 5),
);

// Gestion d'une erreur
await ErrorHandler.instance.handleError(
  exception,
  stackTrace: stackTrace,
  screen: 'LoginScreen',
  action: 'signIn',
  context: {'email': email},
);

// Exécution sécurisée
final result = await ErrorHandler.instance.safeExecute(
  () => apiCall(),
  screen: 'HomeScreen',
  action: 'loadData',
  defaultValue: [],
);
```

### SecureLogger

```dart
// Configuration
SecureLogger.instance.configure(
  enableConsole: true,
  consoleMinLevel: LogLevel.debug,
  enableRemote: true,
  remoteMinLevel: LogLevel.warning,
);

// Logging simple
await SecureLogger.instance.info('Operation successful');

// Logging avec contexte
await SecureLogger.instance.warning('Warning message',
  context: {'user_id': userId},
  screen: 'UserProfile',
);

// Logging des actions utilisateur
await SecureLogger.instance.logUserAction(
  'button_click',
  context: {'button': 'submit'},
  screen: 'FormScreen',
);

// Logging des performances
await SecureLogger.instance.logPerformance(
  'database_query',
  duration,
  context: {'query_type': 'select'},
);

// Extension strings
'User logged in'.logInfo(context: {'user_id': userId});
```

### Network Manager

```dart
// Requête GET simple
final response = await NetworkManager.instance.get(
  'https://api.example.com/data',
  context: {'request_id': '123'},
);

// Requête POST avec body
final response = await NetworkManager.instance.post(
  'https://api.example.com/users',
  body: {'name': 'John', 'email': 'john@example.com'},
  context: {'action': 'create_user'},
);

// Extension strings
final response = await 'https://api.example.com/users'.httpGet(
  context: {'purpose': 'get_users'},
);

// Vérification de connectivité
final isConnected = await NetworkManager.instance.checkConnectivity();
```

## Sécurité

### Sanitisation Automatique

Le système protège automatiquement les données sensibles :

- **Mots de masquage** : password, token, secret, key, auth, credit_card
- **Données personnelles** : phone, email, address, ssn
- **Sanitisation des URLs** : Suppression des paramètres sensibles
- **Sanitisation des messages** : Masquage des numéros de carte bancaire

### Niveaux de Sécurité

1. **Console Logging** : Uniquement en mode debug
2. **Remote Logging** : Niveaux configurables
3. **Data Sanitization** : Automatique pour tous les logs
4. **Error Throttling** : Protection contre les abus

## Bonnes Pratiques

### 1. Utiliser les extensions pour le logging

```dart
// Bon ✅
'User action performed'.logInfo(context: {'action': 'click'});

// Éviter ❌
print('User action performed');
```

### 2. Capturer le contexte pertinent

```dart
// Bon ✅
await ErrorHandler.instance.handleError(
  error,
  screen: 'PaymentScreen',
  action: 'processPayment',
  context: {
    'amount': amount,
    'currency': currency,
    'payment_method': paymentMethod,
  },
);

// Éviter ❌
await ErrorHandler.instance.handleError(error);
```

### 3. Utiliser les niveaux de logging appropriés

```dart
// Debug - Informations détaillées pour le développement
await SecureLogger.instance.debug('Cache cleared');

// Info - Événements importants
await SecureLogger.instance.info('User profile updated');

// Warning - Problèmes potentiels
await SecureLogger.instance.warning('Rate limit approaching');

// Error - Erreurs qui n'empêchent pas l'application de fonctionner
await SecureLogger.instance.error('Failed to load image');

// Critical - Erreurs critiques
await SecureLogger.instance.critical('Database connection lost');
```

### 4. Gérer les erreurs réseau correctement

```dart
// Bon ✅
try {
  final response = await NetworkManager.instance.post(
    url,
    body: data,
    maxRetries: 3,
    context: {'action': 'create_order'},
  );
  return response;
} catch (e) {
  // L'erreur est déjà loggée par NetworkManager
  throw AppException('Failed to create order');
}

// Éviter ❌
try {
  final response = await http.post(Uri.parse(url), body: data);
  return response;
} catch (e) {
  print(e); // Pas de logging structuré
  rethrow;
}
```

## Configuration

### Configuration par défaut

```dart
// ErrorHandler
enableConsoleLogging: true (uniquement en debug)
enableRemoteLogging: true
minLogLevel: LogLevel.info
maxErrorCount: 100
errorThrottle: 5 secondes

// SecureLogger
enableConsole: true
consoleMinLevel: LogLevel.debug
enableRemote: true
remoteMinLevel: LogLevel.warning

// NetworkManager
defaultTimeout: 30 secondes
maxRetries: 3
retryDelay: 1 seconde
```

### Configuration personnalisée

```dart
// Dans main.dart ou l'initialisation de l'application
void setupErrorHandling() {
  // Configuration du ErrorHandler
  ErrorHandler.instance.configure(
    enableConsoleLogging: kDebugMode,
    enableRemoteLogging: true,
    minLogLevel: kDebugMode ? LogLevel.debug : LogLevel.info,
    maxErrorCount: 200,
    errorThrottle: const Duration(seconds: 2),
  );

  // Configuration du SecureLogger
  SecureLogger.instance.configure(
    enableConsole: true,
    consoleMinLevel: kDebugMode ? LogLevel.debug : LogLevel.info,
    enableRemote: true,
    remoteMinLevel: LogLevel.warning,
  );
}
```

## Monitoring

### Écoute des erreurs en temps réel

```dart
// Écoute des erreurs globales
ErrorHandler.instance.errorStream.listen((errorEvent) {
  // Envoyer à un service de monitoring externe
  Sentry.captureException(errorEvent.exception);
});

// Écoute des événements réseau
NetworkManager.instance.networkStream.listen((networkEvent) {
  // Analyser les performances réseau
  Analytics.logNetworkEvent(networkEvent);
});
```

## Tests

Les tests unitaires sont disponibles dans `error_handler_test.dart` :

```bash
flutter test lib/core/utils/error_handler_test.dart
```

## Dépannage

### Problèmes courants

1. **Erreurs non loggées** : Vérifier la configuration des niveaux de logging
2. **Données sensibles dans les logs** : Vérifier que la sanitisation est activée
3. **Trop de logs** : Ajuster le niveau minimum de logging
4. **Problèmes de performance** : Vérifier que le logging distant n'est pas trop fréquent

### Debugging

```dart
// Activer le logging détaillé en développement
if (kDebugMode) {
  SecureLogger.instance.configure(
    enableConsole: true,
    consoleMinLevel: LogLevel.debug,
    enableRemote: false, // Désactiver en développement
  );
}
```

## Notes

- Le système est conçu pour être non-bloquant - les erreurs de logging n'affectent pas l'application
- Les données sensibles sont automatiquement protégées
- Le système est thread-safe et peut être utilisé dans des isolates
- Les performances sont optimisées avec le throttling et la mise en cache