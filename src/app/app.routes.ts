import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'flight-details',
    loadComponent: () => import('./flight-details/flight-details.page').then( m => m.FlightDetailsPage)
  },
];
