import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { profileLeaveGuard } from './guards/profile-leave.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components').then(m => m.ProfilePageComponent),
    canActivate: [AuthGuard],
    canDeactivate: [profileLeaveGuard],
  },
];
