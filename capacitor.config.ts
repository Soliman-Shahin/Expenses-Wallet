import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sh.expenses.wallet',
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
  },
};

export default config;
