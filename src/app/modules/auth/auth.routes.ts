import { Routes } from '@angular/router';
import { LoginComponent, SignupComponent } from './components';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';

export const routes: Routes = [
  { path: '', redirectTo: 'app', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'signup',
    component: SignupComponent,
  },
  {
    path: 'callback',
    component: AuthCallbackComponent,
  },
];
