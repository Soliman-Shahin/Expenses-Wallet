import { Routes } from '@angular/router';

import { APP_ROUTES } from 'src/app/core/constants';

export const routes: Routes = [
  {
    path: '',
    redirectTo: APP_ROUTES.TRANSACTIONS.LIST,
    pathMatch: 'full',
  },
  {
    path: APP_ROUTES.TRANSACTIONS.LIST,
    loadComponent: () => import('./components/transactions-list/transactions-list.component').then(m => m.TransactionsListComponent)
  }
];
