import { Routes } from '@angular/router';
import { APP_ROUTES } from 'src/app/core/constants';

export const routes: Routes = [
  {
    path: '',
    redirectTo: APP_ROUTES.SETTINGS.LIST,
    pathMatch: 'full'
  },
  {
    path: APP_ROUTES.SETTINGS.LIST,
    loadComponent: () => import('./list/settings-list.component').then(m => m.SettingsListComponent)
  },
  {
    path: APP_ROUTES.SETTINGS.SYNC,
    loadComponent: () => import('./sync/pages/sync-settings/sync-settings.page').then(m => m.SyncSettingsPage)
  },
  {
    path: APP_ROUTES.SETTINGS.CONFLICTS,
    loadComponent: () => import('./sync/pages/conflict-resolution/conflict-resolution.page').then(m => m.ConflictResolutionPage)
  },
  {
    path: APP_ROUTES.SETTINGS.BACKUP,
    loadComponent: () => import('./backup/backup.page').then(m => m.BackupSettingsPage)
  }
];
