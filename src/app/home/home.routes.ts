import { Routes } from '@angular/router';
import { APP_ROUTES } from '../core/constants';

export const routes: Routes = [
  {
    path: APP_ROUTES.INDEX,
    loadComponent: () => import('./components/home-page/home-page.component').then(m => m.HomePageComponent),
    data: { title: 'APP_TITLE' },
  },
];
