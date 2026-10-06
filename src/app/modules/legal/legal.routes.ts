import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: 'terms',
    loadComponent: () =>
      import('./legal.page').then((m) => m.LegalPageComponent),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./legal.page').then((m) => m.LegalPageComponent),
  },
];
