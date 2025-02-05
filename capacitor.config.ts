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
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '469160136753-gagip836alvj08k0m07i8m5seq2artua.apps.googleusercontent.com', 
      forceCodeForRefreshToken: true,
    },
    // DeepLinking: {
    //   customURLScheme: 'myapp', 
    //   deepLinks: [
    //     {
    //       scheme: 'myapp',
    //       host: 'auth',
    //       path: '/callback',
    //     },
    //   ],
    // },
  },
};

export default config;
