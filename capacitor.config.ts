import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.landwash.intern',
  appName: 'landwash-intern',
  webDir: 'dist/landwash-intern/browser',
  // Note: For local development, set server.url in capacitor.config.local.ts
  // This file should not contain development-specific URLs
};

export default config;
