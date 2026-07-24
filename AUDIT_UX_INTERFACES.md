# Audit UX — Pharmaci v2.0

> **Date :** 24 juillet 2026  
> **Version auditée :** 2.0.0 (branche `2.0.0`)  
> **Tech stack :** Next.js 14 (App Router) · React 18 · Tailwind CSS · shadcn/ui · Zustand · WebSocket · SSE  
> **Cible :** Mobile-first (max-w-md)

---

## Table des matières

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Audit par acteur — Patient / Visiteur](#2-audit-par-acteur--patient--visiteur)
3. [Audit par acteur — Pharmacien](#3-audit-par-acteur--pharmacien)
4. [Audit par acteur — Administrateur](#4-audit-par-acteur--administrateur)
5. [Audit transversal — Composants partagés](#5-audit-transversal--composants-partagés)
6. [Audit transversal — Accessibilité](#6-audit-transversal--accessibilité)
7. [Audit transversal — Performance & Données](#7-audit-transversal--performance--donnees)
8. [Synthèse des recommandations prioritaires](#8-synthese-des-recommandations-prioritaires)

---

## 1. Vue d'ensemble de l'architecture

### 1.1 Acteurs identifiés

| Acteur | Tab principal | Écrans dédiés |
|---|---|---|
| **Visiteur** | `home` | Home, Auth, Onboarding |
| **Patient** | `home` | Home, Recherche médicaments, Recherche pharmacies, Commandes, Panier, Profil, Messages, Chat, Notifications, Détail médicament, Détail pharmacie, Carte |
| **Pharmacien** | `pharmacist` | Dashboard, Commandes, Stock, Pharmacie, Messages, Chat, Scan QR |
| **Admin** | `admin` | Dashboard, Utilisateurs, Pharmacies, Commandes |

### 1.2 Navigation

- **Bottom Nav** dynamique par rôle (5 tabs max)
- **Navigation interne** gérée par Zustand (`nav.tab`, `nav.view`, `nav.params`, `nav.history`)
- **Transitions de page** via `<PageTransition>` (Framer Motion)
- **Deep linking** limité : navigation programmatique uniquement (pas de routes URL Next.js pour les sous-views)

### 1.3 Points forts globaux

- ✅ UI cohérente (shadcn/ui, design system unifié)
- ✅ Mode sombre natif via `next-themes`
- ✅ Mode visiteur sans inscription
- ✅ Notifications temps réel (SSE + WebSocket)
- ✅ Recherche vocale et scan de code-barres
- ✅ Skeletons de chargement sur la plupart des écrans
- ✅ Empty states personnalisés (`EmptyState` component)
- ✅ Tri, filtres et pagination sur toutes les listes

---

## 2. Audit par acteur — Patient / Visiteur

### 2.1 Écran d'accueil (`home-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Barre de recherche avec bascule médicaments/pharmacies, suggestions en temps réel, recherche vocale, scan code-barres, recherches récentes, carousel pharmacies de garde, carousel médicaments populaires, panier persistant animé, géolocalisation |
| **Problèmes** | |

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| P-H1 | **Pas de toast d'erreur** pour les `loadInitial` et `checkNotifications` (les `catch` sont silencieux) | L'utilisateur ne sait pas si le contenu est à jour ou en erreur | Ajouter un toast ou un indicateur d'erreur minimal sur la home |
| P-H2 | **Texte d'accueil figé** : "Cherchons votre médicament" s'affiche même pour un visiteur non connecté, et le prénom est hardcodé "Cherchons" si pas de user | Message peu engageant pour un visiteur | Adapter dynamiquement : visiteur → "Découvrez les pharmacies près de chez vous", patient connecté → "Bonjour {prénom}" |
| P-H3 | **Location en dur** : `"Abidjan, Cocody Riviera"` est un placeholder qui ne se met à jour que manuellement | Fausse attente pour les utilisateurs hors Abidjan | Géolocaliser automatiquement au premier lancement et utiliser le reverse geocoding |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| P-H4 | Le carousel "Récemment consultés" réutilise l'icône `Clock` (identique à "Pharmacies de Garde") | Utiliser une icône distincte (ex: `History` ou `RotateCcw`) |
| P-H5 | Le bouton "Mode visiteur" en haut à droite de l'écran d'auth est peu visible et sa fonctionnalité n'est pas évidente | Ajouter un tooltip ou un label plus descriptif |
| P-H6 | Pas d'indicateur de connexion réseau / mode hors ligne sur la home | Afficher une bannière subtile en mode hors ligne |
| P-H7 | Le scan de code-barres occupe tout l'écran (fixed inset-0) sans animation d'entrée | Ajouter une animation slide-up pour une transition plus douce |

---

### 2.2 Recherche de médicaments (`medication-search-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Suggestions autocomplete avec navigation clavier, filtres par catégorie (chips scrollables), filtre ordonnance, tri nom/populaire, pagination "Voir plus", EmptyState avec action "Effacer la recherche" |

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| P-M1 | **Double requête** : `load()` et `fetchSuggestions()` sont appelés simultanément au même `search` (debounce 300ms pour load, 150ms pour suggestions). Les deux interrogent `medicationApi.list()` avec des paramètres similaires | 2 appels réseau pour une seule frappe de l'utilisateur, charge serveur inutile | Fusionner en un seul appel ou utiliser le résultat de l'un pour l'autre |
| P-M2 | **Pas d'erreur toast** : le `catch` dans `load()` fait `console.error` sans informer l'utilisateur | L'utilisateur voit un écran vide sans explication | Ajouter un `pushToast` dans les catches |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| P-M3 | Le compteur de résultats affiché est `total` (total serveur) mais la liste affiche seulement 20 par page | Préciser : "X résultats sur Y" |
| P-M4 | Pas d'indicateur visuel quand le filtre "Ordonnance" est actif au milieu des catégories | Séparer visuellement les filtres "type" des catégories |
| P-M5 | Aucune information de disponibilité en temps réel dans la liste | Ajouter un badge "Disponible dans X pharmacies" sous chaque médicament |

---

### 2.3 Recherche de pharmacies (`pharmacy-search-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Filtres contextuels (Ouvert maintenant, 24/7, De garde, Vaccination), tri par nom/note/distance, pagination, recherche vocale |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| P-P1 | Le tri par distance nécessite la géolocalisation mais l'utilisateur peut ne pas l'avoir activée | Afficher un message "Activez votre position pour le tri par proximité" et griser l'option si pas de position |
| P-P2 | Pas de compteur de résultats total | Ajouter "X résultats sur Y" comme dans la recherche médicaments |
| P-P3 | Les filtres "Ouvert maintenant" et "Ouvert 24/7" sont très similaires — confusion possible | Clarifier avec un tooltip ou regrouper : "Ouvert" + switch "24h/24" |

---

### 2.4 Commandes (`orders-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Filtres par statut (6 statuts), recherche par code/pharmacie, badge commandes actives, résumé panier en haut, EmptyState contextuel |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| P-O1 | Le calcul des commandes actives charge TOUTES les commandes (pas de filtre) puis filtre côté client | Optimiser : ne charger que les commandes actives pour le badge |
| P-O2 | Pas de pull-to-refresh | Ajouter un pull-to-refresh natif pour les commandes |
| P-O3 | Pas de détail du statut dans la carte (ex: date de confirmation, prêt depuis...) | Ajouter un mini-timeline du parcours de la commande |

---

### 2.5 Messagerie (`messages-screen.tsx` + `chat-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | WebSocket temps réel avec fallback REST, indicateurs de saisie, accusé de lecture "Lu", messages groupés par date, bannière connexion perdue, recherche d'utilisateurs pour nouveau chat |

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| P-C1 | **Pas de toast d'erreur** dans `loadConversations` (catch silencieux) | L'utilisateur ne sait pas si le chargement a échoué | Ajouter un toast d'erreur |
| P-C2 | **Aucun message système** initial quand une conversation est vide | L'utilisateur arrive dans un chat vide sans contexte | Ajouter un message d'accueil : "Commencez votre conversation avec {nom}" |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| P-C3 | L'avatar est seulement l'initiale du prénom — impersonnel | Autoriser l'upload d'avatar (déjà possible dans le profil, mais pas affiché dans le chat) |
| P-C4 | Pas de notification push native pour les nouveaux messages | Intégrer les Web Push Notifications (service worker) |
| P-C5 | Pas d'envoi de fichiers / images | Autoriser l'envoi de photos de médicaments/ordonnances |
| P-C6 | La connexion WebSocket se coupe sans retry visible | Afficher un compteur de reconnexion et permettre un "Réessayer" manuel |
| P-C7 | Les conversations ne sont pas triées par date de dernier message côté client | Trier par `lastMessage.createdAt` du plus récent |

---

### 2.6 Profil (`profile-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Upload photo de profil, statistiques personnelles (commandes, dépenses), pharmacies favorites, toggle mode sombre, bouton déconnexion |

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|
| P-PR1 | **Upload photo en base64** directement dans l'API (pas de resize/compression) | Fichiers potentiellement très lourds, lenteur, surcharge serveur | Compresser/redimensionner l'image avant upload (ex: max 200x200, quality 0.7) |
| P-PR2 | **Déconnexion via `confirm()` natif** (window.confirm) | UI non cohérente avec le design system, bloquant sur mobile | Remplacer par un Dialog shadcn/ui avec confirmation stylisée |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| P-PR3 | Les statistiques sont calculées côté client en chargeant TOUTES les commandes | Fournir un endpoint `/api/orders/stats` pour les stats agrégées |
| P-PR4 | Pas de lien "Mes commandes" depuis le profil | Ajouter un accès rapide aux commandes dans les statistiques |
| P-PR5 | Pas d'option "Supprimer mon compte" | Ajouter dans les paramètres (avec confirmation) |

---

### 2.7 Authentification (`auth-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Toggle login/register fluide, mode visiteur, boutons sociaux (placeholder), mot de passe oublié, afficher/masquer mdp |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| P-A1 | Les boutons Google/Facebook affichent "bientôt disponible" via toast — frustrant | Soit les implémenter, soit les retirer pour éviter la frustration |
| P-A2 | Pas de validation visuelle en temps réel des champs (ex: email invalide, mdp trop court avant submit) | Ajouter une validation inline (rouge/vert) au fur et à mesure de la saisie |
| P-A3 | Pas de choix de rôle lors de l'inscription — seul "PATIENT" est possible | Si un pharmacien veut s'inscrire, il ne peut pas. Ajouter un select de rôle ou un lien "Etes-vous pharmacien ?" |
| P-A4 | Le bouton "Mode visiteur" est petit et en haut à droite — facile à manquer | Rendre plus visible ou ajouter un texte explicatif |

---

## 3. Audit par acteur — Pharmacien

### 3.1 Dashboard pharmacien (`pharmacist-dashboard-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | 4 KPI cards (commandes, revenus, stock, avis), graphique revenus 6 mois (Recharts), sélecteur de période, bouton refresh, actions rapides, commandes récentes, badge commandes en attente |

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| PH-D1 | **Loading state minimaliste** : seul un spinner centré pendant le chargement | L'utilisateur ne sait pas ce qui charge | Utiliser des Skeleton cards au lieu d'un spinner unique |
| PH-D2 | **`console.error` silencieux** dans le catch du load | Pas de feedback en cas d'erreur | Afficher un état d'erreur avec bouton retry (comme le fait l'admin dashboard) |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| PH-D3 | Le graphique des revenus n'a pas de données quand la période est "week" | Afficher un message "Données insuffisantes pour cette période" ou adapter le graphique |
| PH-D4 | Pas de drill-down depuis les KPI cards | Rendre cliquables les KPI (ex: cliquer sur "Commandes" → aller à l'onglet Commandes filtré) |
| PH-D5 | Le texte "Bonjour" est générique, pas de date/heure | Ajouter "Bonjour, {prénom} — {date du jour}" |
| PH-D6 | Pas de notification in-app des commandes urgentes sur le dashboard | Ajouter une section "⚠️ Commandes en attente depuis > 2h" |

---

### 3.2 Commandes pharmacien (`pharmacist-orders-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Recherche multi-critères (code, patient, téléphone), tabs par statut, tri par date/montant/patient, actions rapides (Confirmer/Prête/Refuser), dialog de confirmation, chargement en temps réel des stats |

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| PH-O1 | **Recherche client-side après chargement complet** : toutes les commandes sont chargées puis filtrées côté client | Performance dégradée avec beaucoup de commandes | Déporter la recherche côté serveur (query param `search`) |
| PH-O2 | **Pas de badge/count par onglet** : impossible de savoir combien de commandes sont "En attente" vs "Confirmées" sans cliquer | Le pharmacien doit vérifier manuellement chaque onglet | Ajouter un badge numérique sur chaque tab (ex: "En attente (5)") |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| PH-O3 | Pas de pull-to-refresh | Ajouter le pull-to-refresh natif |
| PH-O4 | L'action "Refuser" est positionnée après "Détails" et l'action principale — pas très visible | Mettre "Confirmer" et "Refuser" côte à côte dans une barre d'actions |
| PH-O5 | Pas de possibilité d'ajouter un motif de refus | Ajouter un champ "Motif du refus" dans le dialog de confirmation |
| PH-O6 | Les items de la commande sont tronqués si trop nombreux | Afficher "+X autres articles" avec un lien pour développer |

---

### 3.3 Gestion du stock (`pharmacist-stock-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Écran le plus complet : CRUD complet, ajustement rapide +/-1, filtres avancés (stock bas, expiration, catégorie), tri multi-critères, historique par médicament, export Excel, import Excel avec template, impression PDF, codes couleur stock bas/expiré/expirant bientôt |

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|
| PH-S1 | **Écran très dense** — trop d'actions dans un espace limité (search + 3 boutons + 3 filtres + 3 boutons export/import/print) | Surcharge cognitive, risques de tap erroné sur mobile | Réorganiser : placer export/import/print dans un menu "..." (overflow menu) ou dans un Sheet/Drawer |
| PH-S2 | **Loading state minimaliste** : spinner centré | Pas de feedback visuel riche | Utiliser des Skeleton cards |
| PH-S3 | **Ajustement rapide +/-1 sans confirmation** : un tap accidentel modifie le stock | Risque d'erreur de stock | Ajouter un undo toast (ex: "-1 Paracétamol — Annuler") |
| PH-S4 | **Pas d'erreur toast** dans `loadCategories` et `openAddModal` (catch vides) | Erreurs silencieuses | Ajouter un toast d'erreur |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| PH-S5 | Le tri par date d'expiration est utile mais le label "Expiration" est ambigu | Renommer en "Date d'expiration" |
| PH-S6 | Les `<select>` natifs pour les filtres ne sont pas stylisés | Utiliser un composant Select shadcn/ui pour la cohérence |
| PH-S7 | Pas de résumé global du stock en haut (ex: X médicaments, Y en stock bas, Z expirés) | Ajouter une barre de résumé en haut de la liste |
| PH-S8 | Pas de recherche par nom dans le modal d'ajout (100 médicaments en dropdown) | Ajouter un champ de recherche dans le select de médicaments du modal |

---

### 3.4 Paramètres pharmacie (`pharmacist-pharmacy-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Formulaire complet avec tous les champs (nom, adresse, ville, quartier, téléphone, email, GPS, horaires, services, paiements), toggles 24h/garde, upload photo, résumé stats en haut (médicaments, commandes, avis) |

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| PH-P1 | **Coordonnées GPS manuelles** : l'utilisateur doit saisir latitude/longitude à la main | Très peu intuitif, source d'erreurs | Ajouter un bouton "Détecter ma position" ou une carte cliquable pour placer le marqueur |
| PH-P2 | **Pas de validation des champs** : le formulaire se soumet sans vérifier que les champs requis sont remplis | Données invalides possibles | Ajouter une validation HTML5 (`required`) et une validation personnalisée |
| PH-P3 | **Photo upload en base64** dans le PUT | Même problème que le profil — fichiers lourds | Compresser avant envoi, ou utiliser un endpoint d'upload fichier dédié |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| PH-P4 | Le formulaire est long et tout sur une seule page | Organiser en sections accordéon (Informations, Horaires, Services, Paiements) |
| PH-P5 | Pas d'indicateur de modifications non sauvegardées | Ajouter un "badge modifié" sur le bouton Save et un "Voulez-vous quitter sans sauvegarder ?" |
| PH-P6 | Les labels "Seuil stock bas" dans les chips de services ne sont pas traduits | Cohérence : "Seuil de rupture de stock" |

---

### 3.5 Scan QR (`scan-order-screen.tsx`) — via bouton flottant

| Aspect | Détail |
|---|---|
| **Points forts** | Bouton flottant accessible depuis n'importe quel écran pharmacien |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| PH-Q1 | Le bouton flottant peut chevaucher le contenu de certains écrans | Ajouter un `margin-bottom` dynamique ou le déplacer selon le scroll |
| PH-Q2 | Pas d'indication de ce que fait le bouton pour un nouveau pharmacien | Ajouter un tooltip au premier lancement ou une animation pulsation |

---

## 4. Audit par acteur — Administrateur

### 4.1 Dashboard admin (`admin-dashboard-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | 4 KPI cards, dernières commandes, gestion rapide (utilisateurs, pharmacies, commandes), top pharmacies, derniers inscrits, état d'erreur avec retry |

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| A-D1 | **Loading state minimaliste** : spinner centré | Même recommandation que le pharmacien — utiliser des Skeleton cards |
| A-D2 | **Pas de graphique** contrairement au dashboard pharmacien | L'admin n'a pas de vue visuelle des tendances | Ajouter au minimum un graphique d'évolution des inscriptions ou des revenus |
| A-D3 | **Pas de sélecteur de période** contrairement au pharmacien | Impossible de filtrer par "ce mois" ou "cette semaine" | Ajouter un sélecteur de période |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| A-D4 | Pas de drill-down sur les KPI cards | Rendre les cartes cliquables |
| A-D5 | "Top pharmacies" ne montre pas le nombre de commandes | Ajouter le volume de commandes dans la card |
| A-D6 | Pas d'alertes (ex: pharmacies non vérifiées, utilisateurs en attente) | Ajouter une section "Points d'attention" |

---

### 4.2 Gestion des utilisateurs (`admin-users-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Pagination, recherche, filtres par rôle, toggle de rôle (Patient ↔ Pharmacien), suppression avec confirmation |

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| A-U1 | **Toggle de rôle limité** : bascule seulement entre PATIENT et PHARMACIST | Impossible de gérer les rôles ADMIN | Ajouter un select dropdown avec les 3 rôles |
| A-U2 | **Pas de toast d'erreur** dans `loadUsers` (catch vide) | Erreur silencieuse | Ajouter un toast |
| A-U3 | **Suppression sans detail** : le dialog dit seulement "Cette action est irréversible" | L'admin ne sait pas quel utilisateur il supprime | Afficher le nom et l'email de l'utilisateur dans le dialog |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| A-U4 | Pas de badge count par rôle dans les tabs | Ajouter "Patients (X)", "Pharmaciens (Y)", "Admins (Z)" |
| A-U5 | Pas de possibility de désactiver un compte (seulement supprimer) | Ajouter un toggle "Actif / Suspendu" en plus de la suppression |
| A-U6 | Pas de détail utilisateur (vue profil) | Ajouter un écran de détail utilisateur avec historique des commandes |
| A-U7 | Pas de filtre par date d'inscription | Ajouter un sélecteur de date |

---

### 4.3 Gestion des pharmacies (`admin-pharmacies-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Pagination, recherche, filtre vérifié/non vérifié, toggle vérification, badges de statut |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| A-P1 | Pas d'édition des informations de la pharmacie par l'admin | Ajouter un écran de détail/modification de pharmacie |
| A-P2 | Pas de suppression de pharmacie | Ajouter avec confirmation forte |
| A-P3 | Le bouton "Vérifier" / "Retirer la vérification" est le seul action disponible | Ajouter plus d'actions : "Suspendre", "Contacter le propriétaire", "Voir le détail" |
| A-P4 | Pas de badge count pour les pharmacies non vérifiées | Ajouter un badge "X en attente" sur le tab "Non vérifiées" |
| A-P5 | Pas de toast d'erreur dans `loadPharmacies` (catch vide) | Ajouter un toast |

---

### 4.4 Commandes admin (`admin-orders-screen.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Pagination serveur, recherche, filtres par statut, affichage du flux patient → pharmacie |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| A-O1 | Pas d'action possible sur les commandes (l'admin est en read-only) | Ajouter la possibilité d'annuler une commande ou de changer son statut |
| A-O2 | Pas de badge count par statut dans les tabs | Ajouter des compteurs |
| A-O3 | Pas de filtre par date | Ajouter un date picker |
| A-O4 | Pas de tri | Ajouter un tri par date/montant |

---

## 5. Audit transversal — Composants partagés

### 5.1 AppHeader (`app-header.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Sticky, backdrop-blur, boutons notification + panier + dark mode, badge animé |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| T-H1 | Le bouton dark mode est TOUJOURS visible dans le header — occupe de la place inutilement | Le déplacer dans les paramètres du profil uniquement (déjà présent) |
| T-H2 | Le bouton panier est affiché même pour les pharmaciens/admins qui n'en ont pas besoin | Conditionner `showCart` selon le rôle |
| T-H3 | Le bouton notification est présent partout mais redirige toujours vers le même écran | Pas de problème fonctionnel, mais les pharmaciens/admins pourraient avoir besoin d'un centre de notifications différent |

### 5.2 BottomNav (`bottom-nav.tsx`)

| Aspect | Détail |
|---|---|
| **Points forts** | Dynamique par rôle, badge ordres en attente (pharmacien), safe-area-inset-bottom |

#### 🟡 Amélioration

| # | Problème | Recommandation |
|---|---|---|
| T-N1 | Le badge `notificationCount` est remis à 0 quand on clique sur l'onglet "Commandes" — mais il peut y avoir des notifications non liées aux commandes | Séparer le badge commandes du badge notifications |
| T-N2 | Pas de long-press ou d'indication d'onglet disponible | L'onglet actif pourrait avoir un indicateur plus visible (ex: barre supérieure) |
| T-N3 | Les labels sont tronqués sur les petits écrans (5 tabs) | Sur les très petits écrans, afficher seulement les icônes sans label |

### 5.3 EmptyState (`empty-state.tsx`)

✅ **Très bien conçu** — 3 variantes, action optionnelle, icones appropriées. Aucune amélioration majeure.

### 5.4 ScreenRouter (`app-shell.tsx`)

#### 🔴 Critique

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| T-R1 | **Navigation par giant if/else chain** : 20+ conditions imbriquées | Difficile à maintenir, risque d'oublier des views | Refactorer en une map `Record<string, ReactNode>` ou un routeur déclaratif |
| T-R2 | **Pas de route 404** : si `tab` et `view` ne correspondent à rien, `HomeScreen` s'affiche par défaut | L'utilisateur ne sait pas qu'il est sur une page non trouvée | Ajouter un écran "Page non trouvée" |

---

## 6. Audit transversal — Accessibilité

### 6.1 Points positifs

- ✅ `aria-label` sur la plupart des boutons d'action (scanner, recherche vocale, dark mode)
- ✅ `aria-pressed` sur les filtres chips
- ✅ `aria-selected` sur les tabs et suggestions
- ✅ `aria-expanded` sur les menus de tri
- ✅ `role="tablist"` et `role="tab"` sur les filtres d'onglets
- ✅ `role="option"` sur les suggestions et conversations
- ✅ `aria-live="polite"` sur l'indicateur de saisie du chat

### 6.2 Points à améliorer

| # | Problème | Sévérité | Recommandation |
|---|---|---|---|
| A11Y-1 | **Pas de `role` ni `aria-label` sur les cartes de médicaments et pharmacies** (boutons sans texte accessible) | Moyenne | Ajouter `aria-label={m.name}` sur chaque carte |
| A11Y-2 | **Les Skeleton loaders** n'ont pas `aria-hidden="true"` | Faible | Les skeletons sont décoratifs — ajouter `aria-hidden` |
| A11Y-3 | **Pas de focus management** après navigation (le focus ne se déplace pas vers le nouveau contenu) | Moyenne | Gérer le focus programmatiquement après chaque navigation |
| A11Y-4 | **Les Dialogs modals** ne gèrent pas le trap focus natif (shadcn/ui le fait normalement, mais à vérifier) | Faible | Vérifier que Radix UI Dialog gère bien le focus trap |
| A11Y-5 | **Pas de skip navigation link** | Faible | Ajouter un "Skip to content" caché pour le clavier |
| A11Y-6 | **Contraste insuffisant** possible sur les labels `text-[10px]` et `text-[11px]` | Moyenne | Vérifier le contraste AA (4.5:1) sur tous les textes de petite taille |
| A11Y-7 | **Les notifications toast** ne sont pas annoncées aux lecteurs d'écran | Faible | Ajouter `role="status"` ou `aria-live="polite"` sur le conteneur de toasts |

---

## 7. Audit transversal — Performance & Données

### 7.1 Chargement de données

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| PERF-1 | **HomeScreen charge 4 requêtes en parallèle + notifications** au premier rendu | Temps de chargement initial élevé, surtout en 3G | Implémenter un cache SWR/React Query pour les données fréquentes (pharmacies de garde, catégories) |
| PERF-2 | **Pas de cache** : chaque retour sur un écran re-fetch les données | Consommation bande passante, latence perçue | Ajouter un cache court (30s-60s) via un store ou SWR |
| PERF-3 | **Polling toutes les 30s** dans HomeScreen pour les notifications ET dans BottomNav pour les pending orders | 2 polling concurrents + SSE notifications = redondance | Unifier : SSE gère les notifications temps réel, pas besoin de polling |
| PERF-4 | **PharmacistOrders charge toutes les commandes puis filtre client-side** | Problème de performance quand le volume grandit | Déporter filtre/recherche/tri côté serveur |
| PERF-5 | **StockScreen recharge à chaque changement de filtre** (useEffect sur lowStockOnly, expiryFilter, category, sort, sortOrder) | Requêtes multiples rapprochées | Debouncer les changements de filtres (300ms) |

### 7.2 Gestion d'état

| # | Problème | Recommandation |
|---|---|---|
| STATE-1 | Le store Zustand mélange navigation, user, cart, toasts, onboarding — tout dans un seul store | Séparer en slices : `useNavStore`, `useUserStore`, `useCartStore`, `useUIStore` |
| STATE-2 | Les `nav.params` est un objet non typé (`{}`) | Typer les params possibles par view pour éviter les erreurs |

### 7.3 Gestion des erreurs

| # | Problème | Fréquence | Recommandation |
|---|---|---|---|
| ERR-1 | **Catch vides / silencieux** très fréquents (au moins 15 occurrences) | Critique | Remplacer TOUS les `catch {}` et `catch { // ignore }` par un `pushToast` ou un `setError` |
| ERR-2 | Pas d'ErrorBoundary par écran (seulement un global dans AppShell) | Moyenne | Ajouter des ErrorBoundary spécifiques par feature |

---

## 8. Synthèse des recommandations prioritaires

### 🔴 Critique (à traiter en priorité)

| Priorité | Recommandation | Acteurs concernés | Effort estimé |
|---|---|---|---|
| **P0** | Remplacer TOUS les `catch` silencieux par un feedback utilisateur (toast ou état d'erreur) | Tous | Moyen |
| **P0** | Ajouter des Skeleton loaders au lieu des spinners centrés (dashboards pharmacist + admin) | Pharmacien, Admin | Faible |
| **P0** | Ajouter un mécanisme d'undo sur l'ajustement rapide de stock (+/-1) | Pharmacien | Faible |
| **P1** | Réorganiser la barre d'actions du StockScreen (export/import/print dans un overflow menu) | Pharmacien | Faible |
| **P1** | Implémenter la géolocalisation automatique (détecter au premier lancement) | Patient | Faible |
| **P1** | Refondre le ScreenRouter (remplacer le if/else par un routeur déclaratif) | Tous | Moyen |
| **P1** | Ajouter un select de rôle complet dans l'admin (Patient/Pharmacien/Admin) | Admin | Faible |
| **P1** | Ajouter des badges de comptage sur les tabs de filtres (commandes pharmacist + admin) | Pharmacien, Admin | Faible |
| **P1** | Valider les formulaires (pharmacie, profil) côté client avant envoi | Pharmacien | Faible |
| **P2** | Déporter la recherche et le tri côté serveur pour les commandes pharmacien | Pharmacien | Moyen |
| **P2** | Compresser les images avant upload (profil + pharmacie) | Tous | Faible |
| **P2** | Ajouter la carte interactive pour les coordonnées GPS de la pharmacie | Pharmacien | Moyen |
| **P2** | Supprimer ou implémenter les boutons sociaux Google/Facebook | Patient | Faible |

### 🟡 Amélioration (à planifier)

| Priorité | Recommandation | Acteurs concernés | Effort estimé |
|---|---|---|---|
| **P3** | Ajouter les Web Push Notifications | Tous | Élevé |
| **P3** | Implémenter l'envoi de fichiers/images dans le chat | Tous | Élevé |
| **P3** | Ajouter un graphique d'évolution sur le dashboard admin | Admin | Moyen |
| **P3** | Ajouter un drill-down sur les KPI cards (dashboards) | Pharmacien, Admin | Faible |
| **P3** | Ajouter un sélecteur de période sur le dashboard admin | Admin | Faible |
| **P3** | Ajouter un résumé global en haut du StockScreen | Pharmacien | Faible |
| **P3** | Ajouter un mécanisme de cache (SWR/React Query) | Tous | Moyen |
| **P3** | Supprimer le polling redondant (unifié par SSE) | Tous | Faible |
| **P3** | Ajouter un écran de détail utilisateur pour l'admin | Admin | Moyen |
| **P3** | Ajouter des actions sur les commandes admin (annuler, changer statut) | Admin | Moyen |
| **P3** | Améliorer l'accessibilité (focus management, skip nav, contrastes) | Tous | Moyen |
| **P3** | Séparer le store Zustand en slices | Tous | Moyen |
| **P3** | Ajouter le pull-to-refresh sur les listes | Tous | Faible |
| **P4** | Ajouter la possibilité de suspendre un utilisateur (vs supprimer) | Admin | Faible |
| **P4** | Ajouter un motif de refus pour les commandes pharmacien | Pharmacien | Faible |
| **P4** | Ajouter un indicateur de modifications non sauvegardées (pharmacie) | Pharmacien | Faible |
| **P4** | Améliorer la transition d'entrée du scanner de code-barres | Patient | Faible |

---

## Résumé des scores par acteur

| Acteur | Score global | Points forts | Points à améliorer |
|---|---|---|---|
| **Patient / Visiteur** | ⭐⭐⭐⭐☆ (8/10) | Recherche riche, onboarding fluide, mode visiteur, temps réel, accessibilité correcte | Gestion d'erreurs silencieuse, geolocation manuelle, chat limité (pas de fichiers) |
| **Pharmacien** | ⭐⭐⭐⭐☆ (7.5/10) | Dashboard complet, CRUD stock avancé, import/export Excel, scan QR, confirmation de statut | StockScreen trop dense, GPS manuel, recherche client-side, loading minimal |
| **Admin** | ⭐⭐⭐☆☆ (6.5/10) | Interface propre, vérification pharmacies, gestion utilisateurs, pagination | Fonctionnalités limitées (pas de graphique, pas de période, pas d'édition), toggle rôle limité, pas d'action sur les commandes |

---

*Audit généré automatiquement par analyse statique du code source — v2.0.0*
