import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim() || "http://62.84.185.143:3000/" ;

const config: CapacitorConfig = {
  appId: 'ci.pharmaci.app',
  appName: 'Pharma CI',
  webDir: 'public',
  server: serverUrl
    ? {
        url: serverUrl || "http://62.84.185.143:3000",
        cleartext: serverUrl.startsWith('http://'),
      }
    : undefined,
  plugins: {
    // Configuration des notifications locales
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#FF9800',
      sound: 'beep.wav',
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
  },
};

export default config;
