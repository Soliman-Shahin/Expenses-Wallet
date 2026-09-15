import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/notification-list/notification-list.component').then(
        (m) => m.NotificationListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/notification-detail/notification-detail.component').then(
        (m) => m.NotificationDetailComponent
      ),
  },
];
