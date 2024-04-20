import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Expenses Wallet',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
};

export default config;
