# PharmaCi

🏥 **PharmaCi** est une application mobile innovante qui centralise et facilite l'accès aux informations sur la disponibilité des médicaments dans toutes les pharmacies de Côte d'Ivoire, en commençant par Abidjan.

## 📋 Table des matières

- [Présentation du projet](#présentation-du-projet)
- [Objectifs](#objectifs)
- [Public cible](#public-cible)
- [Fonctionnalités](#fonctionnalités)
- [Architecture technique](#architecture-technique)
- [Installation](#installation)
- [Développement](#développement)
- [Contribution](#contribution)
- [Licence](#licence)

## 🎯 Présentation du projet

PharmaCi est une solution numérique qui répond à un problème crucial en Côte d'Ivoire : la difficulté pour les patients de trouver rapidement des médicaments disponibles dans les pharmacies. L'application agit comme un pont entre les citoyens, les médecins, les hôpitaux et les pharmacies en fournissant des informations en temps réel sur la disponibilité des médicaments.

> **Note importante** : PharmaCi n'est pas une plateforme de vente en ligne, mais un service de recherche et de localisation de médicaments qui respecte les réglementations ivoiriennes en matière de santé et de données.

## 🚀 Objectifs

### Objectif principal

- **Sauver des vies** en permettant de trouver rapidement des médicaments essentiels, notamment en situation d'urgence
- **Réduire la perte de temps** et les déplacements inutiles des patients en quête d'un médicament
- **Faciliter la transparence** et la communication entre les pharmacies, les patients et les institutions médicales

### Objectifs spécifiques

- ✅ Base de données centralisée des stocks disponibles
- ✅ Recherche de médicaments par nom ou molécule
- ✅ Géolocalisation des pharmacies avec le produit recherché
- ✅ Indication de la fraîcheur des données (dernière mise à jour)
- ✅ Mise à jour facile des stocks pour les pharmacies
- ✅ Canaux alternatifs : SMS, USSD, WhatsApp Bot
- ✅ **Phase 1 - Assistant IA de Santé Personnel** : Conseils médicaux instantanés
- ✅ **Phase 1 - Système d'Avis et de Notation** : Évaluations détaillées des pharmacies
- ✅ **Phase 1 - Mode Urgence Amélioré** : Accès rapide aux pharmacies de garde
- ✅ **Phase 1 - Paiement Mobile et Réservation Avancée** : Transactions simplifiées

## 👥 Public cible

### Grand public

- Patients cherchant un médicament
- Personnes en situation d'urgence

### Professionnels de santé

- Médecins et hôpitaux pour prescrire et vérifier la disponibilité
- Pharmaciens pour accroître leur visibilité et mieux informer leur clientèle

### Institutions

- Ministère de la Santé
- Ordre des Pharmaciens
- Assureurs santé

## 🔧 Fonctionnalités

### Pour les patients et citoyens

- **Recherche intelligente** de médicaments par nom, molécule ou catégorie
- **Géolocalisation** des pharmacies avec le produit disponible
- **Navigation intégrée** vers la pharmacie choisie
- **Réservation en ligne** de médicaments
- **Suivi de réservation** en temps réel
- **Accès hors ligne** aux informations précédemment consultées
- **Notifications** de disponibilité de médicaments

#### 🆕 Phase 1 - Fonctionnalités Avancées

- **Assistant IA de Santé Personnel** :
  - Conseils médicaux instantanés par chat vocal ou texte
  - Historique des conversations et réponses sauvegardées
  - Catégories prédéfinies (médicaments, symptômes, posologie, interactions)
  - Indicateurs de fiabilité des réponses

- **Système d'Avis et de Notation** :
  - Évaluation des pharmacies avec système d'étoiles
  - Commentaires détaillés avec points forts/faibles
  - Système de vérification et votes utiles
  - Signalement et modération des avis

- **Mode Urgence Amélioré** :
  - Minuteur d'urgence de 5 minutes avec alertes
  - Catégorisation des urgences (fièvre, douleur, allergie, blessure)
  - Accès immédiat aux pharmacies de garde
  - Carte interactive avec itinéraires vers les pharmacies les plus proches

- **Paiement Mobile et Réservation Avancée** :
  - Paiement par Orange Money, MTN Money, Wave
  - Réservation de plusieurs médicaments avec gestion des quantités
  - Créneaux horaires et options de livraison express
  - Suivi des transactions et reçus numériques

### Pour les pharmaciens

- **Gestion de stock** intuitive et rapide
- **Mises à jour en temps réel** des disponibilités
- **Tableau de bord** avec statistiques et analytics
- **Alertes de stock faible** automatiques
- **Synchronisation automatique** avec le système central
- **Gestion des réservations** et des demandes
- **Interface web complémentaire** pour la gestion

### Canaux d'accès multiples

- **Application mobile** (Android/iOS) - Interface principale
- **SMS** - Pour les utilisateurs sans smartphone
- **USSD** - Accès rapide et universel
- **WhatsApp Bot** - Conversationnel et accessible

## 🏗️ Architecture technique

### Stack technologique

- **Framework** : Flutter 3.9.2+ (multi-plateforme)
- **Langage** : Dart
- **Architecture** : Clean Architecture avec Domain-Driven Design
- **State Management** : Provider Pattern
- **Base de données** : PostgreSQL via Supabase
- **Géolocalisation** : OpenStreetMap avec flutter_map
- **Authentification** : JWT via Supabase Auth
- **IA** : Simulation d'assistant de santé avec scoring de confiance
- **Cartographie** : OpenStreetMap avec tiles et markers personnalisés

### Structure du projet

```text
lib/
├── core/                    # Cœur de l'application
│   ├── app/                # Configuration app
│   ├── constants/          # Constantes
│   └── utils/              # Utilitaires
├── data/                   # Couche données
│   ├── datasources/        # Sources de données
│   ├── models/             # Modèles de données
│   └── repositories/       # Implémentations
├── domain/                 # Couche métier
│   ├── entities/           # Entités métier
│   └── usecases/           # Cas d'utilisation
└── presentation/           # Couche présentation
    ├── providers/          # State management
    ├── widgets/            # Composants réutilisables
    └── views/              # Écrans de l'application
```

### Modèles de données principaux

- **DrugEntity** : Informations sur les médicaments
- **PharmacyEntity** : Détails des pharmacies
- **StockEntity** : Gestion des stocks
- **ReservationEntity** : Suivi des réservations
- **HealthAssistantEntity** : Conversations avec l'assistant IA
- **ReviewEntity** : Avis et évaluations des utilisateurs
- **PaymentEntity** : Transactions et paiements mobiles

## 📦 Installation

### Prérequis

- Flutter SDK 3.9.2 ou supérieur
- Dart SDK
- Android Studio / VS Code
- Émulateur Android ou appareil iOS
- Accès Internet

### Configuration du projet

1. **Cloner le dépôt**

   ```bash
   git clone https://github.com/votre-organisation/pharmaci.git
   cd pharmaci
   ```

2. **Installer les dépendances**

   ```bash
   flutter pub get
   ```

3. **Configurer les variables d'environnement**

   ```bash
   cp lib/core/config/env.example.dart lib/core/config/env.dart
   # Éditer le fichier env.dart avec vos configurations
   ```

4. **Lancer l'application**

   ```bash
   flutter run
   ```

### Configuration des plateformes

#### Android

- Ouvrir `android/app/src/main/AndroidManifest.xml`
- Configurer les permissions nécessaires
- Générer la clé de signature

#### iOS

- Ouvrir `ios/Runner.xcworkspace`
- Configurer les permissions dans `Info.plist`
- Générer les certificats de signature

## 🛠️ Développement

### Commandes utiles

```bash
# Installation des dépendances
flutter pub get

# Analyse du code
flutter analyze

# Exécution des tests
flutter test

# Build debug
flutter run

# Build release APK
flutter build apk --release

# Build iOS
flutter build ios --release

# Nettoyage du projet
flutter clean
```

### Cartes (OpenStreetMap)

L'application utilise OpenStreetMap avec flutter_map pour la cartographie :

- Configuration automatique via le package flutter_map
- Tiles OpenStreetMap pour l'affichage des cartes
- Pas besoin de clé API (contrairement à Google Maps)
- Markers personnalisés pour les pharmacies et position utilisateur
- Support offline avec le cache des tiles

### Configuration Supabase

Copiez le modèle d'environnement et renseignez vos secrets:

```bash
cp lib/core/config/env.example.dart lib/core/config/env.dart
# puis éditez lib/core/config/env.dart
```

Les réservations côté pharmacien utilisent `Env.demoPharmacyId` pour charger les réservations associées.

### Base de données

Le schéma de la base de données est défini dans `lib/core/database/schema.sql` et inclut :
- Tables principales : users, pharmacies, drugs, pharmacy_stocks, reservations
- Tables Phase 1 : payments, reviews, health_assistant_conversations
- Fonctions PostgreSQL pour les calculs de distance et recherche géolocalisée
- Politiques RLS (Row Level Security) pour la sécurité des données

### Structure de développement

Le projet suit les principes **Clean Architecture** et **Domain-Driven Design** :

#### 1. Couche Domain (`lib/domain/`)

Contient la logique métier pure sans dépendances externes :

- **Entities** : Objets métier principaux
- **Use Cases** : Cas d'utilisation par fonctionnalité

#### 2. Couche Data (`lib/data/`)

Gère l'accès aux données :

- **Repositories** : Interfaces d'accès aux données
- **Datasources** : API, base de données locale
- **Models** : DTOs et modèles de données

#### 3. Couche Presentation (`lib/presentation/`)

Interface utilisateur et interactions :

- **Providers** : Gestion d'état avec Provider
- **Widgets** : Composants réutilisables
- **Views** : Écrans organisés par fonctionnalités

### Conventions de codage

- Utiliser `camelCase` pour les variables et fonctions
- Utiliser `PascalCase` pour les classes et types
- Commenter le code en français
- Suivre les guidelines Flutter et Dart
- Tests unitaires obligatoires pour les cas d'utilisation

### Tests

```bash
# Exécuter tous les tests
flutter test

# Exécuter les tests avec coverage
flutter test --coverage

# Tests d'intégration
flutter drive
```

## 🤝 Contribution

Nous accueillons avec plaisir les contributions à PharmaCi ! Pour contribuer :

1. **Forker** le projet
2. **Créer une branche** pour votre fonctionnalité

   ```bash
   git checkout -b feature/ma-nouvelle-fonctionnalite
   ```

3. **Commiter** vos changements

   ```bash
   git commit -m "feat: ajoute ma nouvelle fonctionnalite"
   ```

4. **Pusher** vers votre branche

   ```bash
   git push origin feature/ma-nouvelle-fonctionnalite
   ```

5. **Créer une Pull Request**

### Style de commits

- `feat:` : Nouvelle fonctionnalité
- `fix:` : Correction de bug
- `docs:` : Documentation
- `style:` : Style/formatage
- `refactor:` : Refactoring
- `test:` : Tests
- `chore:` : Tâches de maintenance

## 📱 Démonstration et Screenshots

### Phase 1 - Interface Utilisateur

L'application inclut désormais 4 fonctionnalités majeures implémentées :

1. **Assistant IA de Santé** - Chat interface avec entrée vocale
2. **Système d'Avis** - Évaluations détaillées avec pros/cons
3. **Mode Urgence** - Interface rouge avec minuterie et actions rapides
4. **Paiement Mobile** - Intégration Orange Money, MTN, Wave

### Démo en direct

Pour tester l'application :
- Clonez le dépôt et configurez l'environnement
- Lancez `flutter run` sur votre appareil ou émulateur
- Testez les nouvelles fonctionnalités dans les sections correspondantes

## 📞 Contact et Support

Pour toute question, suggestion ou problème :

- **Email** : contact@pharmaci.ci
- **Site web** : <https://pharmaci.ci>
- **Support technique** : support@pharmaci.ci

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- À tous les pharmaciens partenaires pour leur collaboration
- Au Ministère de la Santé de Côte d'Ivoire pour leur soutien
- À la communauté médicale pour leurs précieux retours

---

Développé avec ❤️ pour la santé publique en Côte d'Ivoire
