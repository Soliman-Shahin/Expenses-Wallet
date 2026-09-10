import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'app', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./components').then((m) => m.SignupComponent),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.component').then(
        (m) => m.AuthCallbackComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/password-recovery.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/password-recovery.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
];
