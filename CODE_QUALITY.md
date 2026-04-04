# Audit de Qualité du Code - Pharmaci

> **Date:** 2026-04-04
> **Statut:** ✅ Analysé - Recommandations fournies

---

## 📊 Vue d'Ensemble

| Métrique | Valeur | Cible |
|----------|--------|-------|
| Fichiers analysés | 172 | - |
| Lignes de code | 41,574 | - |
| Fichiers > 1000 lignes | 5 | 0 |
| Composants React | 90 | - |
| Routes API | 63 | - |

**Évaluation générale:** Bonnes pratiques de sécurité, mais des problèmes d'organisation et de maintenabilité à mesure de la mise à l'échelle.

---

## 🔴 Critiques (Action Immédiate Requise)

### 1. Fichiers Trop Larges

| Fichier | Lignes | Cible |
|---------|--------|-------|
| `auth-screen.tsx` | 1,737 | <500 |
| `admin-medications-view.tsx` | 1,637 | <500 |
| `ph-profile-view.tsx` | 1,242 | <500 |
| `admin-pharmacies-view.tsx` | 1,060 | <500 |
| `admin-reviews-view.tsx` | 1,026 | <500 |

**Impact:** Chargement lent, HMR lent, difficile à maintenir

**Solution:** Découper en sous-composants

### 2. Code Dupliqué

**`formatRelativeTime`** - Dupliqué dans 4+ fichiers
```typescript
// Trouvé dans:
// - admin-medications-view.tsx
// - ph-profile-view.tsx
// - admin-orders-view.tsx
// - ph-orders-view.tsx

// Solution: Créer src/lib/date-utils.ts
export function formatRelativeTime(dateStr: string): string {
  // ...
}
```

**Config Objects** - STATUS_CONFIG, FILTER_TABS dupliqués

**Solution:** Créer `src/lib/constants.ts`

---

## 🟠 Élevés (Action Cette Semaine)

### 1. Type Safety - Utilisation de `any`

**Fichiers affectés:**
- `home-view.tsx` - `useState<any[]>([])`

**Solution:**
```typescript
interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  // ...
}

const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
```

### 2. State Updates Pendant le Render

**Fichier:** `pharmacy-card.tsx` (lignes 59-64)

```typescript
// ❌ ANTI-PATTERN
if (prevFavProp !== pharmacy.isFavorite) {
  setIsFav(pharmacy.isFavorite || false);
}

// ✅ CORRECT
useEffect(() => {
  setIsFav(pharmacy.isFavorite || false);
}, [pharmacy.isFavorite]);
```

### 3. Conditions Complexes Imbriquées

**Fichier:** `admin-medications-view.tsx` (pagination)

**Solution:** Extraire la logique de pagination dans un composant `<Pagination>`

---

## 🟡 Moyens (Action Prochaine Semaine)

### 1. JSDoc Manquant

**Exemple de fonction à documenter:**
```typescript
/**
 * Calcule la distance entre deux coordonnées géographiques.
 * @param lat1 - Latitude du premier point
 * @param lng1 - Longitude du premier point
 * @param lat2 - Latitude du second point
 * @param lng2 - Longitude du second point
 * @returns La distance en kilomètres
 */
export function haversineDistance(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  // ...
}
```

### 2. Noms Incohérents

- `setCurrentView` vs `handleSaveEdit`
- `formatDate` vs `formatFCFA`

**Convention proposée:**
- Event handlers: `handle` + verbe + nom (`handleSaveClick`)
- Getters booléens: `is` + adjectif (`isOpen`, `isLoading`)
- Formateurs: `format` + nom (`formatDate`, `formatPrice`)

### 3. Magic Numbers

```typescript
// ❌
setOtpTimer(300);

// ✅
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
setOtpTimer(OTP_EXPIRY_SECONDS);
```

---

## 🟢 Faibles (Dette Technique)

1. Commentaires needing improvement
2. Minor type safety issues
3. App-shell separation (697 lignes)

---

## 📋 Plan d'Action Priorisé

### Phase 1: Quick Wins (Semaine 1)
- [ ] Extraire `formatRelativeTime` vers `lib/date-utils.ts`
- [ ] Créer `lib/constants.ts` pour les configs dupliquées
- [ ] Remplacer les types `any` par des interfaces
- [ ] Corriger les state updates pendant le render

### Phase 2: Refactor (Semaines 2-3)
- [ ] Découper `auth-screen.tsx` en sous-composants
- [ ] Découper les vues admin (>1000 lignes)
- [ ] Extraire la pagination en composant partagé
- [ ] Ajouter React.memo aux composants fréquents

### Phase 3: Documentation (Semaine 4)
- [ ] Ajouter JSDoc aux fonctions publiques
- [ ] Créer un document de standards de code
- [ ] Documenter l'architecture des composants

### Phase 4: Performance (Semaine 5)
- [ ] Implémenter le code splitting
- [ ] Optimiser les re-renders
- [ ] Ajouter le monitoring

---

## 🎯 Recommandations

### Immédiat
1. **Diviser les gros composants** (>500 lignes)
2. **Extraire les fonctions utilitaires dupliquées**
3. **Corriger les types `any`**

### Court Terme
1. **Standardiser les conventions de nommage**
2. **Ajouter la documentation JSDoc**
3. **Créer des constantes pour les magic numbers**

### Long Terme
1. **Implémenter un système de design**
2. **Ajouter des tests automatisés**
3. **Configurer le CI/CD avec qualité de code**

---

**Estimation:** 60-70 heures sur 5 semaines

Le code est **fonctionnel et sécurisé**, mais nécessite une refactorisation pour une meilleure maintenabilité.
