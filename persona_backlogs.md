Voici une proposition structurée de **users stories**, de **product
backlog** et de **personas** pour ton application de recherche de
médicaments et de pharmacies en Côte d'Ivoire.

---

## 📊 **STATUT DU PROJET - MISE À JOUR**

**Date de mise à jour** : 06 Avril 2026

**Version actuelle** : 1.0 (MVP complet)

**Fonctionnalités implémentées** : 90% du MVP

---

## 1. Personas

### **Persona 1 : Koffi, Patient chronique (Diabétique)**

-   **Âge** : 52 ans
-   **Profession** : Enseignant
-   **Localisation** : Abidjan (Yopougon)
-   **Situation familiale** : Marié, 3 enfants
-   **Problème principal** : Doit se rendre régulièrement en pharmacie
    pour ses médicaments contre le diabète. Il perd souvent du temps à
    chercher les médicaments en stock et à comparer les prix.
-   **Objectifs** :
    -   Trouver rapidement les pharmacies proches qui ont ses
        médicaments en stock.
    -   Éviter les déplacements inutiles.
    -   Recevoir des alertes pour le renouvellement de ses ordonnances.
-   **Comportement** :
    -   Utilise un smartphone Android avec une connexion 3G.
    -   Préfère les solutions simples et intuitives.
    -   Fait confiance aux avis des autres utilisateurs.
-   **Citation** : *"Je veux pouvoir vérifier si mon médicament est
    disponible avant de me déplacer, et être alerté quand il est temps
    de renouveler mon stock."*

### **Persona 2 : Aïcha, Mère de famille**

-   **Âge** : 34 ans
-   **Profession** : Commerçante
-   **Localisation** : Bouaké
-   **Situation familiale** : Mariée, 2 enfants en bas âge
-   **Problème principal** : A du mal à trouver des pharmacies de garde
    la nuit pour ses enfants en cas de fièvre ou de maladie soudaine.
-   **Objectifs** :
    -   Localiser les pharmacies de garde ouvertes 24h/24 près de chez
        elle.
    -   Trouver des médicaments pédiatriques en urgence.
    -   Avoir accès à des conseils fiables sur les médicaments pour
        enfants.
-   **Comportement** :
    -   Utilise principalement WhatsApp et Facebook.
    -   Préfère les applications en français ou en langue locale.
    -   Est prête à payer un peu plus pour une livraison rapide.
-   **Citation** : *"Quand mon enfant tombe malade la nuit, je veux
    savoir immédiatement où trouver une pharmacie ouverte et quels
    médicaments lui donner."*

### **Persona 3 : Dr. Konan, Pharmacien**

-   **Âge** : 45 ans
-   **Profession** : Pharmacien et propriétaire d'une officine à Cocody
-   **Localisation** : Abidjan
-   **Problème principal** : Gérer manuellement les stocks et attirer
    plus de clients dans sa pharmacie.
-   **Objectifs** :
    -   Mettre à jour facilement les stocks de sa pharmacie sur
        l'application.
    -   Fidéliser ses clients avec des promotions et des services
        supplémentaires (livraison, conseils en ligne).
    -   Augmenter la visibilité de sa pharmacie.
-   **Comportement** :
    -   Utilise un ordinateur et un smartphone pour gérer son commerce.
    -   Est ouvert aux nouvelles technologies si elles lui font gagner
        du temps.
-   **Citation** : *"Je veux une solution qui me permet de gérer mes
    stocks en temps réel et d'attirer plus de clients sans effort
    supplémentaire."*

### **Persona 4 : Yaya, Étudiant**

-   **Âge** : 22 ans
-   **Profession** : Étudiant en médecine
-   **Localisation** : Abidjan (Plateau)
-   **Problème principal** : Cherche souvent des médicaments pour
    lui-même ou ses amis, mais a un budget limité.
-   **Objectifs** :
    -   Trouver des médicaments génériques moins chers.
    -   Comparer les prix entre plusieurs pharmacies.
    -   Accéder à des informations fiables sur les médicaments (effets
        secondaires, posologie).
-   **Comportement** :
    -   Utilise principalement son smartphone.
    -   Est à l'aise avec les applications mobiles et les réseaux
        sociaux.
-   **Citation** : *"Je veux pouvoir trouver des médicaments pas chers
    et savoir si un générique existe avant d'acheter."*

---

## 2. Users Stories - STATUT D'IMPLÉMENTATION

### **Pour les patients (Koffi, Aïcha, Yaya)**

1.  **Recherche de médicaments** ✅ **IMPLÉMENTÉ**
    -   ✅ Recherche par nom, nom commercial, principe actif, pathologie
    -   ✅ Filtrage par catégories (Antalgique, Antibiotique, etc.)
    -   ✅ Historique de recherche
    -   ✅ Affichage des alternatives/génériques

2.  **Géolocalisation des pharmacies** ✅ **IMPLÉMENTÉ**
    -   ✅ Carte interactive des pharmacies proches
    -   ✅ Détection automatique de la localisation
    -   ✅ Recherche par ville et quartier
    -   ✅ Filtre pharmacies de garde (24h/24)
    -   ✅ Calcul de distance

3.  **Vérification des stocks** ✅ **IMPLÉMENTÉ**
    -   ✅ Vérification en temps réel avant déplacement
    -   ✅ Affichage de la quantité disponible

4.  **Alertes et rappels** 🔄 **PARTIELLEMENT**
    -   ✅ Système de notifications implémenté
    -   ⏳ Rappels pour renouvellement médicaments chroniques (à développer)

5.  **Réservation et livraison** ✅ **IMPLÉMENTÉ**
    -   ✅ Réservation en ligne (panier multi-médicaments)
    -   ✅ Code de vérification 6 chiffres pour retrait
    -   ✅ Suivi des commandes
    -   ⏳ Livraison à domicile (partenariats livreurs - à développer)

6.  **Avis et notation** ✅ **IMPLÉMENTÉ**
    -   ✅ Notation des pharmacies (étoiles)
    -   ✅ Commentaires et avis
    -   ✅ Affichage des notes moyennes

7.  **Conseils et informations** 🔄 **PARTIELLEMENT**
    -   ✅ Informations de base sur les médicaments (description, posologie)
    -   ✅ Effets secondaires et dosage
    -   ⏳ Chat avec un pharmacien (à développer)

### **Pour les pharmacies (Dr. Konan)**

1.  **Gestion des stocks** ✅ **IMPLÉMENTÉ**
    -   ✅ Mise à jour en temps réel des stocks
    -   ✅ Historique des mouvements de stock
    -   ✅ Alertes de stock faible
    -   ✅ Suivi des dates d'expiration
    -   ✅ Import/Export Excel pour gestion bulk

2.  **Tableau de bord** ✅ **IMPLÉMENTÉ**
    -   ✅ Dashboard avec métriques clés
    -   ✅ Statistiques des commandes
    -   ✅ Revenus et analytics
    -   ✅ Alertes stock faible
    -   ✅ Commandes récentes

3.  **Promotions et fidélisation** ✅ **IMPLÉMENTÉ**
    -   ✅ Création de promotions
    -   ✅ Réductions en pourcentage ou montant fixe
    -   ✅ Planification des promotions
    -   ⏳ Programme de fidélité (cartes - à développer)

4.  **Visibilité** ✅ **IMPLÉMENTÉ**
    -   ✅ Profil pharmacie complet
    -   ✅ Informations de contact et horaires
    -   ✅ Services proposés
    -   ✅ Moyens de paiement acceptés
    -   ✅ Gestion des avis clients

### **Pour les administrateurs**

1.  **Gestion des utilisateurs** ✅ **IMPLÉMENTÉ**
    -   ✅ Gestion des rôles (patient, pharmacien, admin)
    -   ✅ Réinitialisation des mots de passe

2.  **Gestion du contenu** ✅ **IMPLÉMENTÉ**
    -   ✅ Base de données médicaments
    -   ✅ Gestion des pharmacies
    -   ✅ Modération des avis

3.  **Analytics et reporting** ✅ **IMPLÉMENTÉ**
    -   ✅ Statistiques système
    -   ✅ Suivi des revenus
    -   ✅ Top pharmacies et médicaments

---

## 3. Product Backlog - MISE À JOUR

### **MVP (Version 1.0) - STATUT : COMPLET À 90%**

  ---------------------------------------------------------------------------------
  Priorité   User Story               Description                  Statut
  ---------------------------------------------------------------------------------
  1          Recherche de médicaments Permettre aux utilisateurs   ✅ IMPLÉMENTÉ
             par nom ou pathologie    de rechercher un médicament.
             ⦿ Recherche par nom, nom commercial,
               principe actif
             ⦿ Filtrage par catégories
             ⦿ Historique de recherche

  2          Géolocalisation des      Intégrer une carte           ✅ IMPLÉMENTÉ
             pharmacies sur une carte interactive
             interactive              ⦿ Détection auto localisation
             ⦿ Recherche par ville/quartier
             ⦿ Filtre pharmacies de garde
             ⦿ Calcul de distance

  3          Vérification des stocks  Afficher la disponibilité    ✅ IMPLÉMENTÉ
             en temps réel            des médicaments en temps réel
             ⦿ Quantité disponible
             ⦿ Alertes stock faible (pharmacien)

  4          Fiche détaillée des      Permettre aux utilisateurs   ✅ IMPLÉMENTÉ
             pharmacies (horaires,    de voir les informations
             coordonnées, services)   d'une pharmacie
             ⦿ Horaires et contacts
             ⦿ Services et moyens de paiement
             ⦿ Infos parking

  5          Compte utilisateur       Créer un espace personnel    ✅ IMPLÉMENTÉ
             (historique, liste de    pour chaque utilisateur
             médicaments fréquents)   ⦿ Auth email/mot de passe + Google
             ⦿ Profils patients
             ⦿ Historique commandes
             ⦿ Favoris pharmacies

  6          Tableau de bord pour les Permettre aux pharmacies de  ✅ IMPLÉMENTÉ
             pharmacies (gestion des  gérer leurs stocks
             stocks)                 ⦿ Mise à jour stocks
             ⦿ Historique mouvements
             ⦿ Import/Export Excel
             ⦿ Alertes stock faible

  7          Système de notation et   Permettre aux utilisateurs   ✅ IMPLÉMENTÉ
             d'avis                   de noter les pharmacies
             ⦿ Notes étoiles
             ⦿ Commentaires
             ⦿ Réponses pharmaciens

  8          Commandes/Réservations  Permettre les commandes      ✅ IMPLÉMENTÉ
             en ligne                en ligne
             ⦿ Panier multi-médicaments
             ⦿ Code vérification 6 chiffres
             ⦿ Suivi statut commande
             ⦿ Historique commandes
  ---------------------------------------------------------------------------------

### **Version 2.0 (Améliorations) - STATUT : EN COURS**

  --------------------------------------------------------------------------------
  Priorité   User Story               Description                Statut
  --------------------------------------------------------------------------------
  9          Alertes pour le          Envoyer des notifications   🔄 PARTIEL
             renouvellement des       pour renouvellement
             médicaments chroniques   ⦿ Système notifications ✅
             ⦿ Rappels automatiques ⏳

  10         Suggestions              Proposer des équivalents    ✅ IMPLÉMENTÉ
             d'alternatives           moins chers (base de données
             génériques               alternatives)

  11         Filtre pour les          Permettre de filtrer les    ✅ IMPLÉMENTÉ
             pharmacies de garde      pharmacies ouvertes 24h/24

  12         Promotions               Permettre aux pharmacies    ✅ IMPLÉMENTÉ
             pharmacies               de créer des promotions
             ⦿ Réductions %/fixe
             ⦿ Planification dates

  13         Analytics                Statistiques détaillées     ✅ IMPLÉMENTÉ
             pharmacie                pour pharmaciens
             ⦿ Revenus, commandes
             ⦿ Tops et tendances

  14         Intégration des          Permettre le paiement en    ⏳ À FAIRE
             paiements (Mobile Money) ligne via Mobile Money
             (MTN/Orange/Orange Money/
             Moov/Moov Money)

  15         Chat pharmacien          Messagerie avec             ⏳ À FAIRE
             pharmaciens              pharmacien pour conseils
  --------------------------------------------------------------------------------

### **Version 3.0 (Fonctionnalités avancées) - STATUT : À DÉVELOPPER**

  --------------------------------------------------------------------------------
  Priorité   User Story           Description                    Statut
  --------------------------------------------------------------------------------
  16         Livraison à domicile Partenariat avec des livreurs  ⏳ À FAIRE
                                  locaux

  17         Mode hors ligne      Permettre un accès limité sans  ⏳ À FAIRE
                                  connexion internet

  18         Programme de         Permettre aux pharmacies de    ⏳ À FAIRE
             fidélité pour les    proposer des cartes de
             pharmacies           fidélité

  19         Intégration avec les Permettre aux utilisateurs de  ⏳ À FAIRE
             assurances santé     payer avec leur assurance

  20         Alertes automatiques Notifications push             ⏳ À FAIRE
             intelligentes        intelligentes basées sur le
                                  profil utilisateur

  21         OCR Ordonnances      Scan d'ordonnances             ⏳ À FAIRE
             automatique          pour commande rapide
  --------------------------------------------------------------------------------

---

## 4. Fonctionnalités Supplémentaires Implémentées (Non Prévues Initialement)

### **Fonctionnalités Admin**
- ✅ Dashboard admin avec statistiques globales
- ✅ Gestion des utilisateurs et rôles
- ✅ Validation des pharmacies
- ✅ Modération des avis
- ✅ Système de maintenance

### **Fonctionnalités Techniques**
- ✅ Authentification Google OAuth
- ✅ Vérification OTP par SMS
- ✅ Système de notifications in-app
- ✅ Import/Export Excel pour stocks
- ✅ Design mobile-first responsive
- ✅ Carte interactive avec géolocalisation

### **Base de Données**
- ✅ 172 pharmacies (principalement Abidjan)
- ✅ 311 médicaments référencés
- ✅ 5 utilisateurs de démonstration
- ✅ Système de relations médicamenteuses

---

## 5. Prochaines Étapes Prioritaires

### **Court terme (1-2 mois)**

1.  **Intégration Mobile Money** - Priorité haute
    - Intégration MTN Mobile Money API
    - Intégration Orange Money API
    - Tests de paiement

2.  **Alertes renouvellement** - Priorité haute
    - Implémentation des rappels automatiques
    - Configuration des périodes de rappel
    - Notifications push

3.  **Chat pharmacien** - Priorité moyenne
    - Système de messagerie
    - Notifications de nouveaux messages
    - Interface de gestion des conversations

### **Moyen terme (3-6 mois)**

4.  **Livraison à domicile**
    - Partenariats avec livreurs
    - Tracking des livraisons
    - Intégration des frais de livraison

5.  **Mode hors ligne**
    - Cache des données essentielles
    - Synchronisation progressive
    - Mode lecture limité

6.  **Programme de fidélité**
    - Cartes de fidélité virtuelles
    - Points et récompenses
    - Offres personnalisées

### **Long terme (6-12 mois)**

7.  **Intégration assurances**
    - Partenariats avec compagnies d'assurance
    - Vérification des couvertures
    - Traitement des remboursements

8.  **OCR Ordonnances**
    - Scan automatique
    - Reconnaissance des médicaments
    - Commande rapide

---

## 6. Données de Démo

**Comptes créés pour tests :**

| Rôle           | Email                    | Mot de passe |
|----------------|--------------------------|--------------|
| Admin          | admin@pharmaci.ci        | demo1234     |
| Pharmacien     | konan@pharmacie.ci       | demo1234     |
| Patient 1      | koffi.yao@example.com    | demo1234     |
| Patient 2      | aicha.kone@example.com   | demo1234     |
| Patient 3      | yaya.toure@example.com   | demo1234     |

**Données de démonstration :**
- 172 pharmacies (Abidjan et environs)
- 311 médicaments
- Pharmacie de garde pour le pharmacien démo : Pharmacie de la Paix

---

## 7. Architecture Technique

**Stack actuel :**
- Frontend : Next.js 15 (App Router), React 19
- UI : shadcn/ui, Tailwind CSS
- Backend : Next.js API Routes
- Base de données : SQLite (Prisma ORM)
- Auth : JWT, Google OAuth
- Cartes : Leaflet (OpenStreetMap)
- Notifications : Système interne

**Futurs intégrations :**
- Mobile Money APIs
- SMS/WhatsApp notifications
- Service de livraison
- Assurance APIs

---

**Légende :**
- ✅ **IMPLÉMENTÉ** - Fonctionnalité complète
- 🔄 **PARTIELLEMENT** - Fonctionnalité partielle ou à améliorer
- ⏳ **À FAIRE** - Fonctionnalité non commencée
