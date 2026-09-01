import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/notification-detail/notification-detail.component').then(
        (m) => m.NotificationDetailComponent
      ),
  },
];
