import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { APP_ROUTES } from 'src/app/core/constants';
import { SyncSettingsPage } from './sync/pages/sync-settings/sync-settings.page';
import { ConflictResolutionPage } from './sync/pages/conflict-resolution/conflict-resolution.page';
import { SettingsListComponent } from './list/settings-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: APP_ROUTES.SETTINGS.LIST,
    pathMatch: 'full'
  },
  {
    path: APP_ROUTES.SETTINGS.LIST,
    component: SettingsListComponent
  },
  {
    path: APP_ROUTES.SETTINGS.SYNC,
    component: SyncSettingsPage
  },
  {
    path: APP_ROUTES.SETTINGS.CONFLICTS,
    component: ConflictResolutionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule { }
