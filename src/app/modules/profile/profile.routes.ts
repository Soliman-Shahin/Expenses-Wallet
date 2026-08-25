import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components').then(m => m.ProfilePageComponent),
    canActivate: [AuthGuard],
  },
];
