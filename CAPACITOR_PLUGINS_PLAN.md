# Plan d'implémentation des plugins Capacitor

## État actuel

- ✅ Capacitor Core installé (v8.3.0)
- ✅ Platforms Android et iOS configurées
- ✅ Permissions Android configurées
- ❌ Aucun plugin natif implémenté

## Plugins à implémenter

### 1. Plugins prioritaires (Fonctionnalités core)

#### Camera (@capacitor/camera)
**Utilisation**: Permettre aux utilisateurs de prendre des photos d'ordonnances
- Upload d'ordonnances pour validation
- Photos de profil
- Capture de documents

**Installation**:
```bash
npm install @capacitor/camera
npx cap sync
```

**Utilisation prévue**:
- Page de commande : Ajouter une photo d'ordonnance
- Profil : Changer la photo de profil
- Pharmacist : Scanner des documents

#### Barcode Scanner (@capacitor/barcode-scanner)
**Utilisation**: Scanner les QR codes de commande à la pharmacie
- Scan du code QR de vérification de commande
- Scan rapide de médicaments

**Installation**:
```bash
npm install @capacitor/barcode-scanner
npx cap sync
```

**Utilisation prévue**:
- Vue Mes commandes : Bouton "Scanner QR" natif
- Pharmacist : Scan rapide de produits

#### Geolocation (@capacitor/geolocation)
**Utilisation**: Localisation précise des utilisateurs
- Remplacer l'API navigateur actuelle
- Meilleure précision sur mobile
- Gestion des permissions native

**Installation**:
```bash
npm install @capacitor/geolocation
npx cap sync
```

**Utilisation prévue**:
- Remplacer `use-user-location.ts`
- Page carte : Position précise
- Recherche : Pharmacies les plus proches

#### Local Notifications (@capacitor/local-notifications)
**Utilisation**: Notifications locales pour les événements
- Rappels de commande
- Alertes de stock (pharmacist)
- Notifications programmées

**Installation**:
```bash
npm install @capacitor/local-notifications
npx cap sync
```

**Utilisation prévue**:
- Confirmation de commande : Notification quand prête
- Pharmacist : Alertes de stock faible
- Rappels de médicaments

#### Haptics (@capacitor/haptics)
**Utilisation**: Feedback vibreur pour les interactions
- Confirmation d'actions
- Erreurs
- Feedback tactile

**Installation**:
```bash
npm install @capacitor/haptics
npx cap sync
```

**Utilisation prévue**:
- Ajout au panier : vibration légère
- Erreur : vibration d'erreur
- Succès : vibration de succès

---

### 2. Plugins UX (Amélioration de l'expérience)

#### Action Sheet (@capacitor/action-sheet)
**Utilisation**: Menus d'action natifs iOS/Android
- Options de partage
- Sélection d'actions contextuelles

**Installation**:
```bash
npm install @capacitor/action-sheet
npx cap sync
```

#### App (@capacitor/app)
**Utilisation**: Informations et contrôle de l'application
- Version de l'app
- États de l'app (active, background, etc.)
- Gestion du splash screen

**Installation**:
```bash
npm install @capacitor/app
npx cap sync
```

#### System Bars (@capacitor/status-bar)
**Utilisation**: Style des barres d'état et de navigation
- Couleur de la barre d'état
- Mode overlay sur Android
- Style de la barre de navigation

**Installation**:
```bash
npm install @capacitor/status-bar
npx cap sync
```

---

### 3. Plugins avancés (Fonctionnalités futures)

#### Cookies (@capacitor/cookies)
**Utilisation**: Gestion native des cookies
- Persistance des cookies
- Gestion cross-platform

**Installation**:
```bash
npm install @capacitor/cookies
npx cap sync
```

#### Push Notifications (@capacitor/push-notifications)
**Utilisation**: Notifications push serveur
- Notifications en temps réel
- Mises à jour de commande
- Promotions

**Installation**:
```bash
npm install @capacitor/push-notifications
npx cap sync
```

**Note**: Nécessite une configuration serveur (Firebase, OneSignal, etc.)

---

## Structure d'implémentation proposée

```
src/lib/capacitor/
├── camera.ts              # Wrapper Camera
├── barcode-scanner.ts     # Wrapper Barcode Scanner
├── geolocation.ts         # Wrapper Geolocation
├── notifications.ts       # Wrapper Local Notifications
├── haptics.ts            # Wrapper Haptics
├── action-sheet.ts       # Wrapper Action Sheet
├── app.ts                # Wrapper App
└── index.ts              # Exportations unifiées

src/hooks/
├── use-capacitor-camera.ts
├── use-capacitor-geolocation.ts
├── use-capacitor-notifications.ts
└── use-capacitor-haptics.ts
```

---

## Mise à jour de capacitor.config.ts

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ci.pharmaci.app',
  appName: 'Pharma CI',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "http://62.84.185.143:3000/",
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#FF9800',
      sound: 'beep.wav',
    },
    Camera: {
      permissions: ['camera', 'photos'],
    },
    BarcodeScanner: {
      configure: {
        enabled: true,
      },
    },
  },
};

export default config;
```

---

## Ordre d'implémentation recommandé

### Phase 1 - Core (Immédiat)
1. **Haptics** - Plus simple, feedback immédiat
2. **Camera** - Fonctionnalité demandée
3. **Geolocation** - Remplacement de l'API navigateur

### Phase 2 - Fonctionnalités (Court terme)
4. **Local Notifications** - Alertes commande
5. **Barcode Scanner** - Scan QR code
6. **App** - Infos application

### Phase 3 - UX (Moyen terme)
7. **Action Sheet** - Menus natifs
8. **System Bars** - Style barres

### Phase 4 - Avancés (Long terme)
9. **Cookies** - Gestion cookies
10. **Push Notifications** - Notifications serveur

---

## Commandes d'installation globales

```bash
# Installation de tous les plugins
npm install @capacitor/camera
npm install @capacitor/barcode-scanner
npm install @capacitor/geolocation
npm install @capacitor/local-notifications
npm install @capacitor/haptics
npm install @capacitor/action-sheet
npm install @capacitor/app
npm install @capacitor/status-bar
npm install @capacitor/cookies
npm install @capacitor/push-notifications

# Synchronisation avec les platforms natives
npx cap sync
```

---

## Notes importantes

1. **Permissions Android**: Déjà configurées dans AndroidManifest.xml
2. **Permissions iOS**: Seront ajoutées automatiquement lors du `cap sync`
3. **Testing**: Toujours tester sur device physique (pas d'émulateur pour Camera/Barcode)
4. **Fallback**: Garder les implémentations web comme fallback
