# Pharmaci

> Application de recherche et gestion de pharmacies pour la Côte d'Ivoire

Pharmaci est une application web moderne qui permet aux patients de trouver des pharmacies, de vérifier la disponibilité des médicaments, et de gérer leurs ordonnances, tout en offrant aux pharmaciens des outils pour gérer leur stock et leurs commandes.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Base de données](#base-de-données)
- [Structure du projet](#structure-du-projet)
- [API Routes](#api-routes)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Développement](#développement)
- [Déploiement](#déploiement)
- [Contribuer](#contribuer)
- [Licence](#licence)

## Fonctionnalités

### Pour les Patients

- **Recherche de médicaments** - Trouver rapidement des médicaments par nom, principe actif ou pathologie
- **Localisation de pharmacies** - Trouver les pharmacies à proximité avec filtres (garde, 24h, ville)
- **Disponibilité en stock** - Vérifier la disponibilité des médicaments en temps réel
- **Favoris** - Sauvegarder ses pharmacies préférées
- **Historique des commandes** - Suivre ses achats et retraits
- **Cartes interactives** - Visualiser les pharmacies sur une carte et obtenir les directions
- **Avis et notes** - Consulter les retours de la communauté sur les pharmacies
- **Alternatives génériques** - Découvrir les médicaments génériques équivalents

### Pour les Pharmaciens

- **Gestion des stocks** - Suivi en temps réel de l'inventaire
- **Gestion des commandes** - Voir et traiter les commandes clients
- **Tableau de bord** - Statistiques de vente et indicateurs
- **Promotions** - Créer et gérer les offres spéciales
- **Messagerie** - Communication avec les clients
- **Profil** - Mettre à jour les informations de la pharmacie
- **Historique des stocks** - Suivi des mouvements de stock
- **Export Excel** - Importer/exporter les données de stock

### Pour les Administrateurs

- **Gestion des utilisateurs** - Surveiller et gérer les comptes
- **Vérification des pharmacies** - Approuver les nouvelles inscriptions
- **Modération** - Gérer les avis et le contenu
- **Analytiques** - Statistiques d'utilisation du système
- **Configuration** - Gérer les paramètres de l'application

## Architecture

L'application suit une architecture **Full-Stack Next.js** avec séparation claire entre frontend et backend :

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Client)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  React      │  │  Tailwind   │  │  Zustand    │     │
│  │  Components │  │  CSS        │  │  State      │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Auth       │  │  Resources  │  │  Admin      │     │
│  │  Middleware │  │  Controllers│  │  Panel      │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer (Prisma)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Models     │  │  Queries    │  │  Migrations │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   SQLite Database                        │
└─────────────────────────────────────────────────────────┘
```

## Technologies

### Frontend

- **[Next.js 16](https://nextjs.org/)** - Framework React avec App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Typage statique
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling utility-first
- **[shadcn/ui](https://ui.shadcn.com/)** - Composants UI réutilisables (Radix UI)
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Gestion d'état client
- **[Framer Motion](https://www.framer.com/motion/)** - Animations fluides
- **[Lucide React](https://lucide.dev/)** - Icônes
- **[React Leaflet](https://react-leaflet.js.org/)** - Cartes interactives
- **[React Hook Form](https://react-hook-form.com/)** - Gestion des formulaires
- **[Zod](https://zod.dev/)** - Validation des schémas
- **[TanStack Query](https://tanstack.com/query)** - Gestion des requêtes API
- **[Recharts](https://recharts.org/)** - Graphiques et visualisations

### Backend

- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - API backend
- **[Prisma](https://www.prisma.io/)** - ORM TypeScript
- **[SQLite](https://www.sqlite.org/)** - Base de données
- **[Jose](https://github.com/panva/jose)** - Authentification JWT
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Hachage des mots de passe

### DevOps

- **[ESLint](https://eslint.org/)** - Linter JavaScript/TypeScript
- **[Caddy](https://caddyserver.com/)** - Reverse proxy (production)

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **[Node.js](https://nodejs.org/)** (v18 ou supérieur)
- **[npm](https://www.npmjs.com/)** ou **[pnpm](https://pnpm.io/)**
- **[Git](https://git-scm.com/)**

## Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/pharmaci.git
cd pharmaci

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
```

## Configuration

Créez un fichier `.env` à la racine du projet :

```env
# Base de données
DATABASE_URL=file:./prisma/db/custom.db

# Authentification JWT
JWT_SECRET=votre-secret-key-ici

# Environnement
NODE_ENV=development
PORT=3000
```

## Base de données

```bash
# Générer le client Prisma
npx prisma generate

# Créer la base de données et appliquer les migrations
npx prisma migrate dev --name init

# (Optionnel) Charger les données de démonstration
npx prisma db seed
```

### Schéma de la base de données

L'application utilise les modèles suivants :

| Modèle | Description |
|--------|-------------|
| `User` | Utilisateurs (patients, pharmaciens, admins) |
| `Pharmacy` | Pharmacies avec localisation et horaires |
| `Medication` | Catalogue de médicaments |
| `PharmacyMedication` | Stocks et prix par pharmacie |
| `Order` | Commandes clients |
| `Review` | Avis et notes |
| `Favorite` | Pharmacies favorites |
| `StockHistory` | Historique des mouvements de stock |
| `Promotion` | Offres promotionnelles |
| `Message` | Messagerie entre utilisateurs |

## Structure du projet

```
pharmaci/
├── prisma/
│   ├── schema.prisma          # Schéma de la base de données
│   ├── seed.ts                # Données de démonstration
│   └── migrations/            # Migrations Prisma
├── public/
│   └── ...                    # Assets statiques
├── src/
│   ├── app/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentification
│   │   │   ├── medications/   # Gestion des médicaments
│   │   │   ├── pharmacies/    # Gestion des pharmacies
│   │   │   ├── orders/        # Gestion des commandes
│   │   │   ├── reviews/       # Avis
│   │   │   ├── favorites/     # Favoris
│   │   │   ├── pharmacist/    # API pharmaciens
│   │   │   └── admin/         # API admin
│   │   ├── (pages)/           # Pages principales
│   │   └── layout.tsx         # Layout racine
│   ├── components/
│   │   ├── ui/                # Composants shadcn/ui
│   │   └── ...                # Composants personnalisés
│   ├── lib/
│   │   ├── db.ts              # Client Prisma
│   │   ├── auth.ts            # Utilitaires d'auth
│   │   └── ...                # Autres utilitaires
│   ├── stores/
│   │   └── use-app-shell.ts   # État global (Zustand)
│   └── types/
│       └── ...                # Types TypeScript
├── .env                       # Variables d'environnement
├── next.config.ts             # Configuration Next.js
├── tailwind.config.ts         # Configuration Tailwind
└── tsconfig.json              # Configuration TypeScript
```

## API Routes

### Authentification

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/auth/login` | POST | Connexion utilisateur |
| `/api/auth/register` | POST | Inscription nouvel utilisateur |
| `/api/auth/logout` | POST | Déconnexion |
| `/api/auth/me` | GET | Récupérer l'utilisateur connecté |
| `/api/auth/google` | POST | Connexion Google OAuth |

### Médicaments

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/medications` | GET | Lister les médicaments |
| `/api/medications` | POST | Créer un médicament (admin) |
| `/api/medications/[id]` | GET | Détails d'un médicament |
| `/api/medications/[id]` | PUT | Modifier un médicament |
| `/api/medications/[id]` | DELETE | Supprimer un médicament |

### Pharmacies

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/pharmacies` | GET | Lister les pharmacies |
| `/api/pharmacies` | POST | Créer une pharmacie |
| `/api/pharmacies/[id]` | GET | Détails d'une pharmacie |
| `/api/pharmacies/[id]` | PUT | Modifier une pharmacie |
| `/api/pharmacies/[id]/stocks` | GET | Stocks de la pharmacie |
| `/api/pharmacies/[id]/stocks` | PUT | Mettre à jour les stocks |
| `/api/pharmacies/[id]/medications` | GET | Médicaments disponibles |

### Commandes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/orders` | GET | Lister les commandes |
| `/api/orders` | POST | Créer une commande |
| `/api/orders/[id]` | GET | Détails d'une commande |
| `/api/orders/[id]` | PUT | Modifier une commande |
| `/api/orders/[id]` | DELETE | Annuler une commande |

### Pharmaciens

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/pharmacist/dashboard` | GET | Statistiques du tableau de bord |
| `/api/pharmacist/stocks` | GET | Gestion des stocks |
| `/api/pharmacist/stocks/[id]` | PUT | Modifier un stock |
| `/api/pharmacist/orders` | GET | Commandes de la pharmacie |
| `/api/pharmacist/orders/[id]` | PUT | Traiter une commande |
| `/api/pharmacist/promotions` | GET | Liste des promotions |
| `/api/pharmacist/reviews` | GET | Avis de la pharmacie |
| `/api/pharmacist/messages` | GET | Messages reçus |
| `/api/pharmacist/profile` | GET/PUT | Profil de la pharmacie |

### Admin

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/admin/dashboard` | GET | Statistiques globales |
| `/api/admin/users` | GET | Liste des utilisateurs |
| `/api/admin/pharmacies` | GET | Liste des pharmacies |
| `/api/admin/orders` | GET | Liste des commandes |
| `/api/admin/reviews` | GET | Liste des avis |
| `/api/admin/medications` | GET | Liste des médicaments |
| `/api/admin/reset` | POST | Réinitialiser la base de données |

## Comptes de démonstration

Après avoir lancé le seed, vous pouvez utiliser ces comptes :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | `admin@pharmapp.ci` | `demo1234` |
| **Pharmacien** | `konan@pharmacie.ci` | `demo1234` |
| **Patient** | `koffi@example.com` | `demo1234` |

## Développement

```bash
# Lancer le serveur de développement
npm run dev

# Lancer les tests
npm test

# Lancer le linter
npm run lint

# Compiler pour la production
npm run build

# Démarrer le serveur de production
npm start
```

### Scripts utiles

```bash
# Mettre à jour le schéma Prisma
npx prisma db push

# Créer une nouvelle migration
npx prisma migrate dev --name description

# Ouvrir le studio Prisma (GUI)
npx prisma studio

# Recharger les données de démonstration
npx tsx prisma/seed.ts
```

## Déploiement

### Build de production

```bash
# Créer le build standalone
npm run build

# Le build génère :
# - .next/standalone/          # Application autonome
# - .next/standalone/.next/    # Assets Next.js
# - .next/standalone/public/   # Fichiers publics
```

### Avec Docker

```dockerfile
FROM node:18-alpine AS base
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

### Avec Caddy (Reverse Proxy)

```
pharmaci.example.com {
    reverse_proxy localhost:3000
    encode gzip
}
```

## Contribuer

Les contributions sont les bienvenues ! Voici comment vous pouvez aider :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Convention de commits

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatting (style, indentation, etc.)
- `refactor:` Refactoring
- `test:` Ajout de tests
- `chore:` Maintenance

## Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Contact

- **Projet:** [Pharmaci](https://github.com/votre-username/pharmaci)
- **Email:** contact@pharmapp.ci

---

Développé avec ❤️ pour améliorer l'accès aux soins en Côte d'Ivoire
