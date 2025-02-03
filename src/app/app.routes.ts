//app.routes.ts

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/onboarding', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/login/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./auth/signup/signup.page').then((m) => m.SignupPage),
      },
      {
        path: 'callback',
        loadComponent: () =>
          import('./auth/callback/callback.page').then((m) => m.AuthCallbackPage),
      },
      {
        path: 'onboarding',
        loadComponent: () => import('./auth/onboarding/onboarding.page').then( m => m.OnboardingPage)
      },
    ],
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'tab1',
        loadComponent: () =>
          import('./tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'tab2',
        loadComponent: () =>
          import('./tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('./tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./statistics/statistics.page').then((m) => m.StatisticsPage),
      },
      {
        path: '',
        redirectTo: 'tab1',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'flight-details',
    loadComponent: () =>
      import('./flight-details/flight-details.page').then(
        (m) => m.FlightDetailsPage
      ),
  },
  // {
  //   path: '**', 
  //   redirectTo: 'auth/onboarding',
  // },
  {
    path: 'statistics',
    loadComponent: () => import('./statistics/statistics.page').then( m => m.StatisticsPage)
  },
];
