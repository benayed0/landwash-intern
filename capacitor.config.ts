import type { CapacitorConfig } from '@capacitor/cli';

// Local development configuration
// This file is gitignored and safe for local IPs
const config: CapacitorConfig = {
  server: {
    url: 'http://192.168.1.67:4200', // your computer's local IP
    cleartext: true,
  },
};

export default config;
