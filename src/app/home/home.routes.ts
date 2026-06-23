import { Routes } from '@angular/router';
import { APP_ROUTES } from '../core/constants';
import { HomePageComponent } from './components/home-page/home-page.component';

export const routes: Routes = [
  {
    path: APP_ROUTES.INDEX,
    component: HomePageComponent,
    data: { title: 'APP_TITLE' },
  },
];
