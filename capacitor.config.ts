import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rentmaster.app',
  appName: 'RentMaster',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#faf7f2',
  server: {
    // Remove this block before building for production
    // Uncomment to point the app to your live server during dev:
    // url: 'http://YOUR_LOCAL_IP:3005',
    // cleartext: true,
  },
  android: {
    backgroundColor: '#faf7f2',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f59e0b',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f59e0b',
    },
    Keyboard: {
      resize: 'body',
      style: 'LIGHT',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
