# Plan : Limiter les fonctionnalités patient en mode visiteur

## Pattern unifié
Toutes les modifs utilisent le même test que le code existant : un visiteur = `!user` (dans l'app shell, pas d'user ⇒ visiteur). On lit `useAppStore((s) => s.user)` dans chaque composant concerné et on masque/replace l'élément.

---

## 1. Bloquer « Ajouter au panier » (détail médicament)
**Fichier** : `src/components/screens/medication-detail-screen.tsx`
- Lire `const user = useAppStore((s) => s.user);`
- Dans la ligne d'action de chaque pharmacie (ligne ~381-438) :
  - **Visiteur** : masquer le qty stepper (Minus/Plus) et le bouton « Ajouter ». À la place, afficher un petit bouton « Se connecter pour commander » qui appelle `setGuestMode(false)`. Le prix et le stock restent visibles (c'est un comparateur de prix).
  - **Connecté** : comportement inchangé.
- `handleAddToCart` reste tel quel (jamais appelé par un visiteur).

## 2. Bloquer le panier entier
### 2a. `src/components/app/app-header.tsx`
- Ajouter `const user = useAppStore((s) => s.user);`
- N'afficher le bouton panier (`showCart`) que si `showCart && user`. Pour un visiteur, l'icône panier disparaît du header partout.

### 2b. `src/components/screens/home-screen.tsx`
- Masquer le « Cart banner » (lignes ~548-574) pour les visiteurs (`{cart.length > 0 && user && (...)}`).
- Récupérer `user` déjà présent (ligne 45).

### 2c. `src/components/screens/cart-screen.tsx`
- En tête de `CartScreen`, ajouter la garde visiteur : `if (!user) return <GuestPrompt .../>` (importer `GuestPrompt` de `@/components/ui/guest-prompt`, icône `ShoppingBag`, titre « Connexion requise », description « Connectez-vous pour accéder à votre panier et commander. »).
- La `CheckoutScreen` a déjà sa propre garde visiteur → inchangée.

## 3. Bloquer Voix + Code-barres
### 3a. `src/components/screens/home-screen.tsx`
- Entourer le bouton code-barres (ligne ~377-385) de `{barcodeSupported && user && (...)}`
- Entourer le bouton micro (ligne ~386-393) de `{user && (...)}`
- Le overlay scanner (lignes ~758-806) n'est ouvert que via le bouton désormais masqué ⇒ déjà inaccessible au visiteur.

### 3b. `src/components/screens/medication-search-screen.tsx`
- Ajouter `const user = useAppStore((s) => s.user);`
- Entourer le bouton micro (ligne ~196-204) de `{user && (...)}`

### 3c. `src/components/screens/pharmacy-search-screen.tsx`
- Ajouter `const user = useAppStore((s) => s.user);`
- Entourer le bouton micro (ligne ~126-134) de `{user && (...)}`

## 4. Masquer les avis pharmacies
**Fichier** : `src/components/screens/pharmacy-detail-screen.tsx`
- `user` déjà lu (ligne 32).
- Pour un visiteur, ne pas afficher la section « Avis » entière (lignes ~232-289) : l'entourer de `{user && (...)}`.
- La note globale (rating + reviewCount) dans le hero/info reste visible (lecture seule) — seul le bloc avis + bouton « Laisser un avis » est masqué.

---

## Récapitulatif visiteur (après modif)
| Fonctionnalité | Avant | Après |
|---|---|---|
| Accueil, recherche médicaments/pharmacies, carte, détail pharmacie (infos), détail médicament (prix/description) | ✅ | ✅ inchangé |
| Ajouter au panier | ✅ | ❌ → bouton « Se connecter » |
| Icône panier + bannière panier + écran panier | ✅ | ❌ masqué / GuestPrompt |
| Recherche vocale + scan code-barres | ✅ | ❌ masqué |
| Avis pharmacies (section) | ✅ | ❌ masqué |
| Commandes, Messages, Notifications, Profil, Favoris, Checkout | déjà ❌ | ❌ inchangé |

## Non concerné (inchangé)
- Le backend n'a pas besoin de modifications (les routes sensibles exigent déjà auth/role).
- Pas de nouveau composant : réutilisation de `<GuestPrompt>` existant pour l'écran panier.

## Vérification
- `npm run build` (ou `npm run lint`) pour valider les types.
- Test manuel : lancer en mode visiteur et vérifier que les 4 catégories sont bloquées ; se connecter et vérifier qu'elles réapparaissent.