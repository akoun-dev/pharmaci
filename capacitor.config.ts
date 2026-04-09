import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim() || "http://62.84.185.143:3000/" ;

const config: CapacitorConfig = {
  appId: 'ci.pharmaci.app',
  appName: 'Pharma CI',
  webDir: '.next/standalone',
  server: serverUrl
    ? {
        url: serverUrl || "http://62.84.185.143:3000",
        cleartext: serverUrl.startsWith('http://'),
        // Allow cookies to be set from the server
        androidScheme: 'https',
      }
    : undefined,
  plugins: {
    // Configuration pour la gestion des cookies sur Android
    // Capacitor v8 gère les cookies automatiquement via le WebView
    // Il faut s'assurer que le WebView Android accepte les cookies tiers
    WebView: {
      // Override Android WebView settings to enable cookies
      overrideUserAgent: 'PharmaCI-App',
      allowFileAccessFromFileURLs: true,
      allowUniversalAccessFromFileURLs: true,
    },
    // Configuration des notifications locales
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#FF9800',
      sound: 'beep.mp3',
    },
    // Configuration de la caméra
    Camera: {
      permissions: ['camera', 'photos'],
    },
    // Configuration du scanner de codes-barres
    BarcodeScanner: {
      configure: {
        enabled: true,
      },
    },
    // Configuration de la barre d'état
    StatusBar: {
      style: 'LIGHT',
    },
    // Configuration de l'ActionBar (bouton retour Android)
    ActionBar: {
      title: 'Pharma CI',
      backgroundColor: '#FF9800',
      textColor: '#FFFFFF',
    },

    // Splash Screen
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 3000,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
  },
};

export default config;
