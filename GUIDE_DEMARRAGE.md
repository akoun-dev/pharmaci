# 🚀 Guide de Démarrage Rapide - Pharma CI

Ce guide vous accompagne pas à pas pour démarrer le projet Pharma CI, depuis l'installation jusqu'au lancement du serveur de développement.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **[Node.js](https://nodejs.org/)** (v18 ou supérieur) - [Télécharger](https://nodejs.org/)
- **[npm](https://www.npmjs.com/)** (inclus avec Node.js)
- **[Git](https://git-scm.com/)** (optionnel, pour cloner le projet)

### Vérifier votre installation

```bash
node --version  # devrait afficher v18.0.0 ou supérieur
npm --version   # devrait afficher 9.0.0 ou supérieur
```

---

## 📦 Étape 1 : Installation des dépendances

Depuis la racine du projet, exécutez :

```bash
npm install
```

Cette commande va :
- Télécharger toutes les dépendances du projet
- Créer le dossier `node_modules`
- Préparer le projet pour le développement

**Durée estimée :** 2-5 minutes (selon votre connexion)

---

## 🗄️ Étape 2 : Configuration de la base de données

Le projet utilise **Prisma** avec **SQLite** pour la base de données.

### 2.1. Initialiser la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers la base de données
npx prisma db push
```

### 2.2. Appliquer les seeds (données de démonstration)

Les seeds sont des données de test qui vous permettent de démarrer avec une base de données pré-remplie :

```bash
# Exécuter le script de seed
npx tsx prisma/seed.ts
```

**Ce script crée :**
- ✅ **5 utilisateurs** de test (admin, pharmacien, patients)
- ✅ **172 pharmacies** réparties dans plusieurs villes ivoiriennes
- ✅ **12 médicaments** avec différentes catégories
- ✅ **Des stocks** de médicaments dans les pharmacies
- ✅ **Des avis** et des favoris de démonstration

**Durée estimée :** 5-10 secondes

### 2.3. Vérifier la création de la base de données

```bash
# Vérifier que le fichier de base de données existe
ls -la prisma/db/custom.db
```

Le fichier devrait exister et avoir une taille d'environ 1-2 MB.

---

## 🔧 Étape 3 : Configuration des variables d'environnement

Le fichier `.env` est déjà configuré pour le développement. Voici les variables importantes :

```env
# Base de données (chemin absolu recommandé)
DATABASE_URL=file:/home/akoun-dev/Documents/PROJETS/AUTRES/Apps/pharmaci/prisma/db/custom.db

# Authentification JWT
JWT_SECRET=pharmapp-ci-dev-secret-key-2025
CSRF_SECRET=pharmapp-ci-csrf-secret-key-2025

# Environnement
NODE_ENV=development
PORT=3000
```

### Si vous changez de machine

Si vous déplacez le projet sur une autre machine, mettez à jour le `DATABASE_URL` avec votre nouveau chemin absolu :

```bash
# Obtenir le chemin actuel du projet
pwd

# Mettre à jour le .env avec le nouveau chemin
# Remplacez: file:./db/custom.db
# Par: file:/votre/nouveau/chemin/prisma/db/custom.db
```

---

## 🎯 Étape 4 : Lancer le serveur de développement

### 4.1. Premier démarrage (après installation)

```bash
# Lancer le serveur de développement
npm run dev
```

Le serveur démarrera sur **http://localhost:3000**

**Durée estimée :** 3-5 secondes

Vous devriez voir :

```
▲ Next.js 16.2.2
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000
✓ Ready in 3ms
```

### 4.2. Lancement en production (après build)

Si vous avez déjà fait un build :

```bash
# Build de l'application (une seule fois)
npm run build

# Lancer en mode production
npm run dev
```

---

## 🧪 Étape 5 : Vérifier que tout fonctionne

### 5.1. Tester l'application

Ouvrez votre navigateur et accédez à :

**http://localhost:3000**

Vous devriez voir :
- ✅ La page d'accueil avec le logo Pharma CI
- ✅ Une barre de recherche
- ✅ Des statistiques (pharmacies, médicaments, villes)

### 5.2. Tester l'API

```bash
# Test de l'API des pharmacies
curl http://localhost:3000/api/pharmacies

# Test de l'API des médicaments
curl http://localhost:3000/api/medications
```

### 5.3. Tester la connexion

Utilisez les comptes de démonstration créés par les seeds :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | `admin@pharmapp.ci` | `demo1234` |
| **Pharmacien** | `konan@pharmacie.ci` | `demo1234` |
| **Patient** | `koffi@example.com` | `demo1234` |

---

## 🔄 Étape 6 : Commandes utiles pour le développement

### Gestion de la base de données

```bash
# Réinitialiser complètement la base de données (supprime tout)
rm -f prisma/db/custom.db
npx prisma db push
npx tsx prisma/seed.ts

# Mettre à jour le schéma après des modifications
npx prisma db push

# Ouvrir Prisma Studio (interface graphique pour la base de données)
npx prisma studio
```

### Lancement du serveur

```bash
# Mode développement
npm run dev

# Build pour production
npm run build

# Lancer le serveur de production
npm start
```

### Outils de développement

```bash
# Linter
npm run lint

# Voir les processus Node.js en cours
ps aux | grep node

# Arrêter tous les serveurs Next.js
pkill -f "next-server"
```

---

## 🐛 Résolution de problèmes

### Problème : "Unable to open database file"

**Solution :** Le chemin de la base de données dans `.env` utilise un chemin relatif. Changez-le pour un chemin absolu :

```env
# Remplacer
DATABASE_URL=file:./db/custom.db

# Par
DATABASE_URL=file:/chemin/absolu/vers/projet/prisma/db/custom.db
```

### Problème : "CSRF_SECRET not set"

**Solution :** Ajoutez la variable manquante dans votre fichier `.env` :

```env
CSRF_SECRET=pharmapp-ci-csrf-secret-key-2025
```

### Problème : Le port 3000 est déjà utilisé

**Solution :** Changez le port dans `.env` :

```env
PORT=3001
```

Ou arrêtez le processus qui utilise le port 3000 :

```bash
# Trouver le processus
lsof -i :3000

# Le tuer
kill -9 <PID>
```

### Problème : Les seeds ne fonctionnent pas

**Solution :** Réinitialisez la base de données :

```bash
rm -f prisma/db/custom.db
npx prisma db push
npx tsx prisma/seed.ts
```

---

## 📚 Résumé rapide (Commandes essentielles)

```bash
# Installation (une seule fois)
npm install

# Base de données (après installation ou réinitialisation)
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# Lancement du serveur
npm run dev

# Arrêter le serveur : Ctrl + C dans le terminal
```

---

## 🎓 Prochaines étapes

Une fois le projet lancé :

1. **Explorez la documentation API** : `README.md`
2. **Parcourez le code** : `src/` pour la structure
3. **Personnalisez les données** : Modifiez `prisma/seed.ts`
4. **Ajoutez des fonctionnalités** : Créez de nouvelles routes API

---

## 💡 Astuces

- **Hot Reload** : Les modifications du code sont automatiquement appliquées
- **Prisma Studio** : Utilisez `npx prisma studio` pour voir la base de données en graphique
- **Logs** : Les erreurs sont affichées dans le terminal
- **Débogage** : Utilisez `console.log()` ou le débogueur de votre IDE

---

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes :

1. Vérifiez la section **Résolution de problèmes** ci-dessus
2. Consultez le `README.md` pour la documentation complète
3. Vérifiez les logs du serveur dans le terminal

---

**Bon développement ! 🚀**

_Développé avec ❤️ pour améliorer l'accès aux soins en Côte d'Ivoire_
