# ⚡ Quick Start - Pharma CI

Guide de démarrage rapide en 3 étapes.

## 1️⃣ Installation

```bash
npm install
```

## 2️⃣ Base de données

```bash
# Initialiser Prisma
npx prisma generate

# Créer la base de données
npx prisma db push

# Appliquer les seeds (données de test)
npx tsx prisma/seed.ts
```

## 3️⃣ Lancer

```bash
npm run dev
```

**Application disponible sur :** http://localhost:3000

---

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@pharmaci.ci` | `demo1234` |
| Pharmacien | `konan@pharmacie.ci` | `demo1234` |
| Patient | `koffi@example.com` | `demo1234` |

---

## 🔄 Réinitialiser la base de données

```bash
rm -f prisma/db/custom.db && npx prisma db push && npx tsx prisma/seed.ts
```

---

## 🛠️ Commandes utiles

```bash
# Build production
npm run build

# Linter
npm run lint

# Prisma Studio (GUI)
npx prisma studio

# Arrêter le serveur
pkill -f "next-server"
```

---

**Pour plus de détails, voir [GUIDE_DEMARRAGE.md](./GUIDE_DEMARRAGE.md)**
