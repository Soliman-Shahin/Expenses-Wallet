import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shahin.expenseswallet',
  appName: 'Expenses Wallet',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LiveUpdates: {
      appId: '1e7b36fa',
      channel: 'Production',
      autoUpdateMethod: 'background',
      maxVersions: 2,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
    },
    GoogleAuth: {
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
      serverClientId:
        '358709669585-0td9nf2p58ncgtoreopgqkq7vosco473.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
