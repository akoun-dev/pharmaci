# Pharmaci

Application web de recherche de médicaments et de pharmacies pour la Côte d'Ivoire.

Les patients peuvent chercher des médicaments, comparer les prix entre pharmacies, passer des commandes et localiser les pharmacies sur une carte. Les pharmaciens peuvent gérer leur stock et suivre les commandes.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router, mode SPA) |
| UI | React 19, Tailwind CSS, shadcn/ui, Framer Motion |
| State | Zustand (navigation, auth, panier, favoris) |
| Auth | JWT (`jose`), `bcryptjs`, cookies HTTP-only |
| Base de données | SQLite via Prisma 6 |
| Cartes | Leaflet |
| Runtime | Bun |

## Prérequis

- [Bun](https://bun.sh/) (ou Node.js 18+)
- Git

## Installation

```bash
# Cloner le dépôt
git clone <url-du-depot>
cd pharmaci

# Installer les dépendances
bun install

# Configurer les variables d'environnement
cp .env.example .env   # ou éditer .env directement

# Générer le client Prisma
bun run db:generate

# Pousser le schéma en base
bun run db:push

# Peupler la base avec les données de démo
bun run db:seed

# Lancer le serveur de développement
bun run dev
```

L'app est accessible sur http://localhost:3000.

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `bun run dev` | Serveur de développement (port 3000) |
| `bun run build` | Build de production |
| `bun run start` | Lancer en production (Bun) |
| `bun run lint` | Vérifier le code avec ESLint |
| `bun run db:push` | Pousser le schéma Prisma en base |
| `bun run db:generate` | Générer le client Prisma |
| `bun run db:migrate` | Créer une migration |
| `bun run db:reset` | Réinitialiser la base |

## Comptes de démo

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Patient | patient@pharmaci.ci | patient123 |
| Pharmacien | pharma@pharmaci.ci | pharma123 |
| Admin | admin@pharmaci.ci | admin123 |

## Structure du projet

```
pharmaci/
├── prisma/
│   ├── schema.prisma        # Schéma de la base de données
│   └── seed.ts              # Données de démo
├── src/
│   ├── app/
│   │   ├── api/             # Routes API (auth, médicaments, pharmacies, commandes)
│   │   ├── layout.tsx
│   │   └── page.tsx         # Point d'entrée SPA
│   ├── components/          # Composants React (ui/, screens/)
│   ├── lib/                 # Utilitaires (auth, db, helpers)
│   ├── stores/              # État Zustand
│   └── types/               # Types TypeScript
├── public/                  # Assets statiques
├── Caddyfile                # Config reverse proxy (port 81 → 3000)
└── package.json
```

## Modèle de données

- **User** — patients, pharmaciens, admins
- **Pharmacy** — pharmacies avec coordonnées GPS, horaires, services
- **Medication** — médicaments (nom, principe actif, forme, catégorie)
- **PharmacyMedication** — stock et prix par pharmacie (FCFA)
- **Order** / **OrderItem** — commandes avec code de retrait unique
- **Review** — avis patients (1-5 étoiles) sur les pharmacies
- **Favorite** — médicaments favoris des patients
- **Message** — messagerie entre utilisateurs
- **StockHistory** — historique des mouvements de stock

## Fonctionnalités

- Recherche de médicaments avec filtres par catégorie
- Comparaison de prix entre pharmacies
- Panier et passage de commande avec code de retrait
- Carte interactive des pharmacies (Leaflet)
- Pharmacies de garde (ouvertes 24h/24)
- Système d'avis et de favoris
- Mode sombre
- Onboarding pour nouveaux utilisateurs
- Génération de QR code pour les commandes

## Licence

Projet privé.
