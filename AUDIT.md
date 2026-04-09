# Audit Complet - Pharmaci

**Date**: 2025-04-08
**Version**: 1.0.0
**Auteur**: Claude Code

---

## Table des matières

1. [Architecture et structure du projet](#1-architecture-et-structure-du-projet)
2. [Base de données (Prisma)](#2-base-de-données-prisma)
3. [API Routes](#3-api-routes)
4. [Frontend (Components et Views)](#4-frontend-components-et-views)
5. [Authentification et Sécurité](#5-authentification-et-sécurité)
6. [Configuration et Environnement](#6-configuration-et-environnement)
7. [Qualité du code](#7-qualité-du-code)
8. [Performance](#8-performance)
9. [Capacitor/Mobile]((#9-capacitormobile)
10. [Points d'amélioration prioritaires](#10-points-damélioration-prioritaires)

---

## 1. Architecture et structure du projet

### Points forts ✅

- **Architecture Next.js 16** moderne avec app router
- **Séparation claire** des préoccupations :
  - API routes (`src/app/api/`)
  - Composants UI (`src/components/ui/`)
  - Vues (`src/components/views/`)
  - Hooks (`src/hooks/`)
  - Librairies (`src/lib/`)
- **Pattern de conception** MVC bien appliqué
- **TypeScript** utilisé partout pour la sécurité des types

### Points d'amélioration ⚠️

- **Structure des vues très lourde** : 106 fichiers vues/API
- **Importations massives** dans `app-shell.tsx` (50+ imports)
- **Manque d'abstraction** pour les routes communes

---

## 2. Base de données (Prisma)

### Schéma de données ✅

- **Modèles bien définis** : User, Pharmacy, Medication, Order, etc.
- **Relations correctes** avec les bons types de relations
- **Index appropriés** pour les performances

### Problèmes identifiés ❌

#### Champs optionnels incohérents

```prisma
// prisma/schema.prisma
model Pharmacy {
  parkingInfo    String?  // ✅ Bon
  services       String   @default("[]") // ❌ Devrait être String?
  paymentMethods String   @default("[]") // ❌ Devrait être String?
}
```

#### Données en JSON string au lieu de JSON

```prisma
// Actuellement
services String @default("[]")

// Devrait être
services Json @default("[]")
```

### Performance ✅

- **Bon usage des index** sur les champs fréquemment recherchés
- **Jointures optimisées** dans le schéma
- **Pas de N+1 visible** dans les modèles

### Migration et seeders

- **Seed très complet** (100+ pharmacies)
- **Données de test** en dur dans le seed
- **Manque de données de production** réalistes

---

## 3. API Routes

### Structure ✅

- **68 endpoints API** bien organisés
- **Middleware de protection** global
- **Rate limiting** implémenté

### Problèmes critiques 🔴

#### 1. Gestion d'erreurs incohérente

```typescript
// src/app/api/auth/login/route.ts
// Bon exemple
return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });

// Mais manque de validation des entrées
const body = await request.json(); // ❌ Pas de validation Zod
```

**Action requise**: Implémenter Zod sur toutes les routes

#### 2. Absence de validation des données

```typescript
// src/app/api/auth/login/route.ts:28
const body = await request.json();
const { email, password, phone, authProvider } = body;
// ❌ Pas de validation ! Risque d'injection NoSQL
```

#### 3. Sécurité - CSRF partiellement implémenté

```typescript
// middleware.ts:62-72
function requiresCSRFValidation(pathname: string, method: string): boolean {
  // ❌ Skip CSRF for auth routes — PROBLÈME SECURITÉ !
  if (pathname.startsWith('/api/auth/')) return false;
  // Les routes auth devraient avoir leur propre protection CSRF
}
```

#### 4. Exposition potentielle de données

```typescript
// src/app/api/auth/login/route.ts:59
user: {
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone, // ❌ Potentiellement exposé
  role: user.role,
}
```

---

## 4. Frontend (Components et Views)

### Organisation ✅

- **Composants réutilisables** avec Radix UI
- **UI components** bien structurés
- **Views par rôle** (patient, pharmacien, admin)

### Problèmes identifiés ⚠️

#### 1. Performance - Pas de memoization optimale

```typescript
// components/medication-card.tsx
export const MedicationCard = React.memo(function MedicationCard(...)
// ✅ Bon usage de React.memo

// Mais manque de useCallback dans les handlers
onClick={() => onClick(medication.id)} // ❌ Devrait être memoisé
```

#### 2. État global complexe

```typescript
// store/app-store.ts - 260 lignes !
// ❌ Trop de responsabilités dans un seul store
// Devrait être scindé : userStore, uiStore, etc.
```

#### 3. Accessibilité non vérifiée

- ❌ **Pas de tests A11y**
- ❌ **Manque de labels ARIA**
- ❌ **Focus management non géré**

---

## 5. Authentification et Sécurité

### Implémentation ✅

- **JWT avec jose** (edge-compatible)
- **CSRF protection** partiellement implémentée
- **Rate limiting** efficace
- **Hashage bcrypt** pour les mots de passe

### Vulnérabilités potentielles 🔴

#### 1. Secret JWT non validé

```typescript
// src/lib/auth.ts:12
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required but not set');
}
// ❌ Pas de validation de la force du secret
```

**Action requise**: Valider que le secret fait au moins 32 caractères

#### 2. Cookies non sécurisés en production

```typescript
// src/lib/auth.ts:72-84
const isHttps = process.env.HTTPS_ENABLED === 'true' || process.env.NEXTAUTH_URL?.startsWith('https://');
// ❌ Risque : si HTTPS_ENABLED n'est pas set, pas Secure flag
```

**Action requise**: Forcer `Secure: true` en production

#### 3. OTP faible

```typescript
// src/app/api/auth/login/route.ts:92
const otpCode = String(Math.floor(1000 + Math.random() * 9000));
// ❌ OTP sur 4 chiffres = 10 000 combinaisons seulement
// Devrait être 6 chiffres et expiration plus courte
```

**Action requise**:
- Passer à 6 chiffres (1 000 000 combinaisons)
- Expiration à 2 minutes

---

## 6. Configuration et Environnement

### Bonnes pratiques ✅

- **Fichiers .env multiples** (.env, .env.local, etc.)
- **Exemple de configuration** fourni
- **Capacitor configuré** pour mobile

### Problèmes ⚠️

```bash
# .env.example - Trop simple
DATABASE_URL=file:./db/custom.db  # Devrait indiquer SQLite
JWT_SECRET=votre-secret-jwt-ici    # Pas d'exemple de valeur sécurisée
```

---

## 7. Qualité du code

### Points forts ✅

- **TypeScript partout**
- **Logging structuré**
- **Fonctions pures** dans les utils

### Problèmes ⚠️

- **Duplication de code** dans les réponses API
- **Longs fichiers** (app-store.ts: 260 lignes)
- **Manque de documentation** pour les fonctions complexes

---

## 8. Performance

### Optimisations présentes ✅

- **Lazy loading implicite** avec Next.js
- **React.memo** sur certains composants
- **Zustand** pour l'état global (performant)

### Problèmes ❌

- **Pas de code splitting** explicite
- **Bundle size non optimisé**
- **Images non optimisées** (pas de next/image)

---

## 9. Capacitor/Mobile

### Configuration ✅

- **Plugins bien choisis** (géolocalisation, notifications, etc.)
- **Build standalone** configuré
- **Java 17** requis pour Android

### Problèmes ⚠️

- **Code mixte web/mobile** dans certains composants
- **Pas de tests mobile spécifiques**
- **Permissions** gérées uniquement côté client

---

## 10. Points d'amélioration prioritaires

### 🔴 CRITIQUES (à traiter immédiatement)

| # | Problème | Fichier | Action |
|---|----------|---------|--------|
| 1 | Validation absente | `src/app/api/**/*.ts` | Implémenter Zod |
| 2 | OTP faible | `src/app/api/auth/login/route.ts:92` | Passer à 6 chiffres |
| 3 | CSRF contourné | `src/middleware.ts:62-72` | Protéger routes auth |
| 4 | Cookies non sécurisés | `src/lib/auth.ts:72-84` | Forcer Secure en prod |

### 🟡 MOYENS (court terme)

| # | Problème | Action |
|---|----------|--------|
| 1 | `app-shell.tsx` trop gros | Scinder en modules |
| 2 | `app-store.ts` monolithique | Diviser en stores spécialisés |
| 3 | Pas de `useCallback` | Ajouter memoization |
| 4 | JSON comme String | Corriger schéma Prisma |
| 5 | Exposition données sensibles | Filtrer les réponses API |

### 🟢 LONG TERME

| # | Problème | Action |
|---|----------|--------|
| 1 | Pas de tests E2E | Ajouter Playwright/Cypress |
| 2 | Accessibilité | Audit A11y + labels ARIA |
| 3 | Performance | Code splitting + next/image |
| 4 | Monitoring | Intégrer Sentry |

---

## Statistiques du projet

```
┌─────────────────────────┬──────────┐
│ Métrique                │ Valeur   │
├─────────────────────────┼──────────┤
│ Fichiers TS/TSX         │ ~150     │
│ API Routes              │ 68       │
│ Composants UI           │ 45+      │
│ Vues                    │ 25+      │
│ Modèles Prisma          │ 15+      │
│ Hooks personnalisés     │ 5+       │
└─────────────────────────┴──────────┘
```

---

## Conclusion

Le projet **Pharmaci** présente une **architecture solide** avec des technologies modernes et bien choisies. Le code est globalement de bonne qualité avec TypeScript partout et une organisation claire.

Cependant, il présente des **risques de sécurité significatifs** :
- Absence de validation des données en entrée
- Protection CSRF contournée sur les routes d'authentification
- OTP trop faible
- Configuration cookies potentiellement non sécurisée

**La qualité du code est bonne** mais nécessite des refactorisations importantes pour améliorer la maintenabilité (store monolithique, app-shell trop volumineux).

**Avec ces corrections, le projet pourrait devenir une application robuste et scalable prête pour la production.**

---

**Document généré par Claude Code**
*Pour toute question ou clarification, n'hésitez pas à consulter l'équipe de développement.*
