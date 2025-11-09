import type { CapacitorConfig } from '@capacitor/cli';

// Local development configuration
// This file is gitignored and safe for local IPs
const config: CapacitorConfig = {
  appId: 'com.landwash.intern',
  appName: 'Landwash Intern',
  webDir: 'dist/landwash-intern/browser',
  server: {
    url: 'http://192.168.1.67:4200', // your computer's local IP
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
