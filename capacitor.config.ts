import type { CapacitorConfig } from '@capacitor/cli';
import { CapacitorSQLite } from '@capacitor-community/sqlite';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'ionic-app-base',
  webDir: 'www',
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/Databases',
      androidDatabaseLocation: 'default',
    },
  },
};

export default config;
