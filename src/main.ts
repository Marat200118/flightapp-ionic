const ignoredErrors = [
  'Navigator LockManager lock',
  'sb-auth-token',
  'Missing required parameter',
];

const originalConsoleError = console.error;

console.error = (...args: any[]) => {
  const errorMessage = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);

  if (ignoredErrors.some((ignored) => errorMessage.includes(ignored))) {
    return; 
  }

  originalConsoleError(...args); 
};

window.addEventListener('error', (event) => {
  if (event.message.includes('Navigator LockManager lock') || event.message.includes('sb-auth-token')) {
    event.preventDefault();
  }
});


window.addEventListener('unhandledrejection', (event) => {
  const reasonMessage = event.reason?.toString() || '';

  if (
    reasonMessage.includes('Navigator LockManager lock') || 
    reasonMessage.includes('sb-auth-token') || 
    reasonMessage.includes('Acquiring an exclusive')
  ) {
    event.preventDefault();
  }
});


import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage'
import { importProvidersFrom } from '@angular/core'; // Import this helper
import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    importProvidersFrom(
      IonicStorageModule.forRoot({
        name: '__mydb',
        driverOrder: [CordovaSQLiteDriver._driver, Drivers.IndexedDB, Drivers.LocalStorage],
      })
    ),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
  ],
  
});
