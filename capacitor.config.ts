import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sh.expenses.wallet',
  appName: 'Expenses Wallet',
  bundledWebRuntime: false,
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
      launchAutoHide: false,
      launchShowDuration: 3000,
    },
    App: {
      icon: './src/assets/icon/favicon.png',
    },
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      'android-minSdkVersion': '19',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000',
    },
  },
};

export default config;
