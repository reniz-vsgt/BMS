import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.bms',
  appName: 'BMS',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
