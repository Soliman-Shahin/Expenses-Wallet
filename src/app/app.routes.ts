import { Routes } from '@angular/router';
import { AuthGuard, AuthGuardService } from './core/guards/auth.guard';
import { APP_ROUTES } from './core/constants';

export const routes: Routes = [
  {
    path: '',
    redirectTo: APP_ROUTES.HOME,
    pathMatch: 'full',
  },
  {
    path: APP_ROUTES.HOME,
    loadChildren: () => import('./home/home.module').then((m) => m.HomePageModule),
    // Home is public; it contains CTAs to sign in
  },
  // {
  //   path: APP_ROUTES.EXPENSES.INDEX + '/:id',
  //   loadChildren: () =>
  //     import('./pages/expense-detail.routes').then(
  //       (m) => m.EXPENSE_DETAIL_ROUTES
  //     ),
  //   canActivate: [AuthGuard],
  //   canLoad: [AuthGuardService],
  // },
  {
    path: APP_ROUTES.AUTH.INDEX,
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: APP_ROUTES.CATEGORIES.INDEX,
    loadChildren: () =>
      import('./modules/categories/categories.module').then(
        (m) => m.CategoriesModule
      ),
    canActivate: [AuthGuard],
    canLoad: [AuthGuardService],
  },
  {
    path: APP_ROUTES.PROFILE.INDEX,
    loadChildren: () =>
      import('./modules/profile/profile.module').then(
        (m) => m.ProfileModule
      ),
    canActivate: [AuthGuard],
    canLoad: [AuthGuardService],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];