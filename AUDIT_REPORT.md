# Audit de Code - Pharma CI

**Date:** 07/04/2026  
**Projet:** Application de gestion de pharmacies (Next.js + Prisma + SQLite)

---

## 📊 Résumé Exécutif

Ce rapport présente les résultats de l'audit de sécurité, performance et qualité du code de l'application Pharma CI. L'application est une plateforme de gestion de pharmacies développée avec Next.js 16, Prisma, et SQLite.

### Score Global: **7.5/10**

| Catégorie       | Score | Statut         |
| --------------- | ----- | -------------- |
| Sécurité        | 7/10  | ⚠️ À améliorer |
| Performance     | 8/10  | ✅ Bon         |
| Qualité du code | 7/10  | ⚠️ À améliorer |
| Architecture    | 8/10  | ✅ Bon         |

---

## 🔴 Problèmes Critiques (Haute Priorité)

### 1. Validation des mots de passe incohérente

**Fichier:** [`src/app/api/auth/register/route.ts`](src/app/api/auth/register/route.ts:30)

```typescript
// Le code valide le mot de passe avec seulement 6 caractères
if (password.length < 6) {
    return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
    )
}
```

**Problème:** Le schéma de validation Zod dans [`src/lib/validations.ts`](src/lib/validations.ts:14) exige 8 caractères minimum, mais le code d'inscription accepte 6 caractères.

**Recommandation:** Uniformiser la validation des mots de passe et utiliser le schéma Zod `passwordSchema` partout.

---

### 2. ESLint trop permissif

**Fichier:** [`eslint.config.mjs`](eslint.config.mjs:9)

```javascript
const eslintConfig = [
    ...nextCoreWebVitals,
    ...nextTypescript,
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "react-hooks/exhaustive-deps": "off",
            "no-console": "off",
            // ... de nombreuses règles désactivées
        },
    },
]
```

**Problème:** Trop de règles ESLint sont désactivées, ce qui peut masquer des bugs potentiels et réduire la qualité du code.

**Recommandation:** Réactiver progressivement les règles importantes, notamment:

- `@typescript-eslint/no-unused-vars`
- `react-hooks/exhaustive-deps`
- `@typescript-eslint/no-explicit-any`

---

### 3. TypeScript `ignoreBuildErrors` activé

**Fichier:** [`next.config.ts`](next.config.ts:7)

```typescript
typescript: {
  ignoreBuildErrors: true,
},
```

**Problème:** Cette configuration permet de builder même avec des erreurs TypeScript, ce qui peut masquer des bugs.

**Recommandation:** Corriger les erreurs TypeScript et désactiver cette option.

---

## 🟠 Problèmes Moyens (Priorité Modérée)

### 4. Rate Limiting en mémoire

**Fichier:** [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts:16)

```typescript
// In-memory rate limit storage
// For production, use Redis or a database
const rateLimitStore = new Map<string, RateLimitEntry>()
```

**Problème:** Le rate limiting est stocké en mémoire, ce qui ne fonctionne pas correctement en mode multi-instance/serveur.

**Recommandation:** Implémenter un stockage Redis ou database pour la production.

---

### 5. OTP codé en dur pour la démonstration

**Fichier:** [`src/components/views/auth-view.tsx`](src/components/views/auth-view.tsx:79)

```typescript
setDemoOtp(sendData._demoCode || "")
```

**Problème:** L'OTP de démonstration est exposé côté client, ce qui pourrait être exploité en production si le code de démo n'est pas désactivé.

**Recommandation:** S'assurer que le mode démo est désactivé en production via une variable d'environnement.

---

### 6. Absence de validation CSRF sur certaines routes

**Fichier:** [`src/middleware.ts`](src/middleware.ts:57)

```typescript
// Skip CSRF for auth routes (login/register handle their own security)
if (pathname.startsWith("/api/auth/")) return false
```

**Problème:** Les routes d'authentification sont exclues de la validation CSRF, ce qui est acceptable pour login/register mais pourrait poser problème pour d'autres routes sous `/api/auth/`.

**Recommandation:** Vérifier que seules les routes login/register sont exemptées.

---

### 7. Utilisation excessive de `any` dans les composants

**Fichier:** [`src/components/views/home-view.tsx`](src/components/views/home-view.tsx:31)

```typescript
const [guardPharmacies, setGuardPharmacies] = useState<any[]>([])
const [allPharmacies, setAllPharmacies] = useState<any[]>([])
```

**Problème:** L'utilisation de `any` supprime la vérification de type TypeScript.

**Recommandation:** Définir des interfaces TypeScript pour les données.

---

## 🟢 Points Positifs

### Sécurité

- ✅ **Authentification JWT robuste** avec jose (Edge-compatible)
- ✅ **Protection CSRF** implémentée avec tokens cryptographiques
- ✅ **Hachage bcrypt** avec 10 rounds pour les mots de passe
- ✅ **Cookies HttpOnly** pour les sessions
- ✅ **Rate limiting** sur les endpoints d'authentification
- ✅ **Validation des types de fichiers** par magic numbers
- ✅ **Sanitisation des noms de fichiers** pour éviter le directory traversal

### Performance

- ✅ **Optimisation des imports** avec `optimizePackageImports`
- ✅ **Singleton PrismaClient** pour éviter les connexions multiples
- ✅ **Compression activée** et headers de caching configurés
- ✅ **Images optimisées** avec AVIF/WebP

### Architecture

- ✅ **Structure modulaire** claire (api/, components/, lib/, store/)
- ✅ **Séparation des responsabilités** entre vues et logique métier
- ✅ **État global** géré avec Zustand
- ✅ **API Routes** bien organisées par domaine

---

## 📋 Recommandations Détaillées

### Court Terme (1-2 semaines)

1. **Uniformiser la validation des mots de passe**
    - Utiliser `passwordSchema` de Zod dans toutes les routes
    - Minimum 8 caractères avec complexité

2. **Corriger les erreurs TypeScript**
    - Désactiver `ignoreBuildErrors`
    - Typer correctement les composants

3. **Vérifier la configuration de production**
    - S'assurer que `NODE_ENV=production` est bien défini
    - Désactiver les fonctionnalités de démo

### Moyen Terme (1 mois)

4. **Implémenter Redis pour le rate limiting**

    ```typescript
    // Exemple avec Redis
    import { Redis } from "ioredis"
    const redis = new Redis(process.env.REDIS_URL)
    ```

5. **Réactiver les règles ESLint progressivement**
    - Commencer par `no-unused-vars`
    - Puis `@typescript-eslint/no-explicit-any`

6. **Ajouter des tests unitaires**
    - Tests des API routes critiques
    - Tests des utilitaires d'authentification

### Long Terme (2-3 mois)

7. **Migration vers PostgreSQL**
    - SQLite n'est pas adapté à la production pour une app multi-utilisateurs
    - Prisma supporte facilement la migration

8. **Implémenter un système de logging centralisé**
    - Winston ou Pino pour les logs structurés
    - Intégration avec un service de monitoring

9. **Ajouter une couche de validation API**
    - Utiliser les schémas Zod de manière systématique
    - Middleware de validation

---

## 🔍 Analyse par Fichier

### Fichiers Audités

| Fichier                                  | Score | Commentaire                        |
| ---------------------------------------- | ----- | ---------------------------------- |
| `src/lib/auth.ts`                        | 9/10  | Excellente implémentation JWT      |
| `src/lib/csrf.ts`                        | 9/10  | Protection CSRF robuste            |
| `src/lib/rate-limit.ts`                  | 6/10  | Fonctionnel mais en mémoire        |
| `src/lib/db.ts`                          | 8/10  | Singleton bien implémenté          |
| `src/middleware.ts`                      | 8/10  | Protection des routes correcte     |
| `src/lib/validations.ts`                 | 8/10  | Schémas Zod bien définis           |
| `src/app/api/auth/login/route.ts`        | 8/10  | Rate limiting + authentification   |
| `src/app/api/auth/register/route.ts`     | 6/10  | Validation incohérente             |
| `src/app/api/pharmacist/upload/route.ts` | 9/10  | Excellente validation des fichiers |
| `eslint.config.mjs`                      | 4/10  | Trop de règles désactivées         |
| `next.config.ts`                         | 6/10  | ignoreBuildErrors problématique    |
| `prisma/schema.prisma`                   | 8/10  | Schéma bien structuré avec index   |

---

## 📈 Métriques

- **Nombre de fichiers analysés:** 30+
- **Vulnérabilités critiques:** 3
- **Vulnérabilités moyennes:** 4
- **Points positifs identifiés:** 15+
- **Recommandations:** 9

---

## 🎯 Conclusion

L'application Pharma CI présente une **bonne base architecturale** avec des mécanismes de sécurité solides (JWT, CSRF, rate limiting). Cependant, plusieurs points nécessitent une attention particulière avant une mise en production:

1. **Corriger la validation des mots de passe** (critique)
2. **Désactiver `ignoreBuildErrors`** et corriger les erreurs TypeScript
3. **Réactiver les règles ESLint** importantes
4. **Migrer le rate limiting vers Redis** pour la production

L'application est actuellement adaptée pour un environnement de développement/démo mais nécessite les corrections ci-dessus pour une mise en production sécurisée.

---

_Audit généré automatiquement - À compléter par une revue manuelle approfondie._
