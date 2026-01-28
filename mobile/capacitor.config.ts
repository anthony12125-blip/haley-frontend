import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.haleyos.app',
  appName: 'HaleyOS',
  webDir: 'www',

  // Point to the live web app
  server: {
    url: 'https://haley-front-end.web.app',
    cleartext: false,
    // Allow navigation within the app domain
    allowNavigation: [
      'haley-front-end.web.app',
      '*.firebaseapp.com',
      '*.googleapis.com',
      'logic-engine-core2-409495160162.us-central1.run.app',
    ],
  },

  // iOS configuration
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    // Full-screen webview with safe area handling
    preferredContentMode: 'mobile',
    backgroundColor: '#000000',
    scheme: 'haleyos',
  },

  // Android configuration
  android: {
    backgroundColor: '#000000',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Full-screen immersive
    initialFocus: true,
  },

  // Splash screen
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#000000',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
