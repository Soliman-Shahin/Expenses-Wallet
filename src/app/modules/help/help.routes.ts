import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/help.page').then(m => m.HelpPageComponent),
  },
];
