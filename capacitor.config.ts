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
};

export default config;
