# Architecture & Dépendances - Pharmaci

> **Date:** 2026-04-04
> **Statut:** ✅ Analysé et optimisé

---

## 📊 Statistiques du Projet

| Métrique | Valeur |
|----------|-------|
| Fichiers TypeScript/TSX | 172 |
| Composants React | 90 |
| Routes API | 63 |
| Dépendances installées | ~45 |
| Dépendances inutilisées | 11 (supprimées) |

---

## 🏗️ Architecture de l'Application

### Structure des Dossiers

```
pharmaci/
├── prisma/
│   ├── schema.prisma          # Schéma de la base de données
│   ├── seed.ts                # Données de démonstration
│   ├── db/                    # Fichiers de base de données
│   └── migrations/            # Migrations Prisma
│
├── public/
│   └── uploads/               # Fichiers uploadés
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (63 endpoints)
│   │   │   ├── auth/          # Authentification
│   │   │   ├── admin/         # Endpoints admin
│   │   │   ├── pharmacist/    # Endpoints pharmaciens
│   │   │   ├── medications/   # CRUD médicaments
│   │   │   ├── pharmacies/    # CRUD pharmacies
│   │   │   ├── orders/        # Gestion commandes
│   │   │   └── ...
│   │   ├── (pages)/           # Pages principales
│   │   └── layout.tsx         # Layout racine
│   │
│   ├── components/            # Composants React (90)
│   │   ├── ui/                # shadcn/ui components (60+)
│   │   ├── views/             # Vues de l'application
│   │   └── ...                # Autres composants
│   │
│   ├── lib/                   # Utilitaires et helpers
│   │   ├── db.ts              # Client Prisma
│   │   ├── auth.ts            # JWT + sessions
│   │   ├── logger.ts          # Logger conditionnel
│   │   ├── validations.ts     # Schémas Zod
│   │   ├── api-response.ts    # Gestion d'erreurs
│   │   ├── csrf.ts            # Protection CSRF
│   │   └── rate-limit.ts      # Rate limiting
│   │
│   ├── stores/                # État global (Zustand)
│   │   ├── app-store.ts       # État de l'application
│   │   └── cart-store.ts      # État du panier
│   │
│   ├── hooks/                 # React hooks personnalisés
│   └── types/                 # Types TypeScript
│
├── .env                       # Variables d'environnement
├── next.config.ts             # Configuration Next.js
├── tailwind.config.ts         # Configuration Tailwind
└── tsconfig.json              # Configuration TypeScript
```

---

## 🎨 Architecture en Couches

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React      │  │   Tailwind   │  │   Framer     │      │
│  │   Components │  │   CSS        │  │   Motion     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT                       │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Zustand    │  │   React      │                        │
│  │   Stores     │  │   Hooks      │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        BUSINESS LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API Routes │  │   Middleware │  │   Valid.     │      │
│  │   (Next.js)  │  │   (Auth)     │  │   (Zod)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATA LAYER                           │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Prisma     │  │   SQLite     │                        │
│  │   ORM        │  │   Database   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Dépendances Principales

### Core Framework
| Package | Version | Description |
|---------|---------|-------------|
| next | 16.2.2 | Framework React |
| react | 19.0.0 | Bibliothèque UI |
| typescript | 5.9.3 | Typage statique |

### UI & Styling
| Package | Version | Description |
|---------|---------|-------------|
| tailwindcss | - | Framework CSS utility-first |
| @radix-ui/* | - | Composants UI accessibles |
| framer-motion | - | Animations React |
| lucide-react | 0.525.0 | Icônes |
| recharts | 2.15.4 | Graphiques |

### Backend
| Package | Version | Description |
|---------|---------|-------------|
| @prisma/client | 6.19.3 | ORM Client |
| prisma | 6.19.3 | ORM Toolkit |
| jose | - | JWT pour Edge Runtime |
| bcryptjs | - | Hachage mots de passe |

### Validation & Forms
| Package | Version | Description |
|---------|---------|-------------|
| zod | 4.3.6 | Validation de schémas |
| react-hook-form | - | Gestion formulaires |

### State & Data
| Package | Version | Description |
|---------|---------|-------------|
| zustand | - | Gestion d'état |
| react-leaflet | - | Cartes interactives |

---

## 🔐 Points d'Entrée API

### Authentification
- `POST /api/auth/login` - Connexion (rate-limited)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Session actuelle
- `POST /api/auth/phone/verify` - Vérification téléphone

### Publiques (sans auth)
- `GET /api/medications` - Liste médicaments (paginé)
- `GET /api/medications/[id]` - Détails médicament
- `GET /api/pharmacies` - Liste pharmacies (paginé)
- `GET /api/pharmacies/[id]` - Détails pharmacie
- `GET /api/pharmacies/[id]/medications` - Stocks
- `GET /api/reviews` - Avis

### Protégées (auth requise)
- `GET /api/orders` - Commandes utilisateur
- `POST /api/orders` - Créer commande
- `GET /api/favorites` - Favoris
- `POST /api/favorites` - Ajouter favori
- `DELETE /api/favorites/[id]` - Supprimer favori

### Pharmaciens (role: pharmacist)
- `GET /api/pharmacist/dashboard` - Statistiques
- `GET /api/pharmacist/stocks` - Gestion stocks
- `GET /api/pharmacist/orders` - Commandes reçues
- `POST /api/pharmacist/upload` - Upload images

### Admin (role: admin)
- `GET /api/admin/dashboard` - Vue d'ensemble
- `GET /api/admin/users` - Gestion utilisateurs
- `GET /api/admin/pharmacies` - Gestion pharmacies

---

## 🔒 Sécurité Implémentée

| Mesure | Emplacement | Statut |
|--------|-------------|--------|
| JWT Auth | `src/lib/auth.ts` | ✅ |
| CSRF Protection | `src/lib/csrf.ts` | ✅ |
| Rate Limiting | `src/lib/rate-limit.ts` | ✅ |
| Input Validation | `src/lib/validations.ts` | ✅ |
| Password Hashing | bcryptjs | ✅ |
| SQL Injection Prevention | Prisma + Zod | ✅ |
| XSS Prevention | React (auto-escape) | ✅ |
| File Upload Security | Magic numbers | ✅ |
| Secure Logging | `src/lib/logger.ts` | ✅ |
| Error Handling | `src/lib/api-response.ts` | ✅ |

---

## 📈 Performances

### Optimisations
- **Pagination** sur toutes les routes list
- **Indexes DB** sur les champs fréquemment recherchés
- **Lazy loading** des composants
- **Image optimization** avec Next.js Image
- **Code splitting** automatique (Next.js)

### Cache Strategy
- **Static Generation** pour pages publiques
- **Incremental Static Regeneration** disponible
- **Client-side caching** avec React Query

---

## 🚀 Déploiement

### Build Configuration
```json
{
  "output": "standalone",
  "outputExport": "standalone"
}
```

### Environment Variables
```env
DATABASE_URL=file:./db/custom.db
JWT_SECRET=<secret>
NODE_ENV=production
PORT=3000
```

### Production Ready
- ✅ Standalone build
- ✅ Optimisations appliquées
- ✅ Sécurité renforcée
- ✅ Error handling
- ✅ Logging conditionnel

---

## 📝 Recommandations

### Court Terme
1. Mettre à jour Prisma vers 7.6.0
2. Corriger les vulnérabilités prismjs
3. Configurer CORS explicitement

### Moyen Terme
1. Implémenter Redis pour le rate limiting en prod
2. Ajouter des tests unitaires
3. Configurer CI/CD

### Long Terme
1. Migrer vers PostgreSQL pour la production
2. Implémenter le monitoring
3. Ajouter la documentation API (OpenAPI/Swagger)

---

**Architecture analysée et optimisée le 2026-04-04**
