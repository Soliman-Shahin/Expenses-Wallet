import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { SyncStatusComponent } from 'src/app/shared/components/sync-status/sync-status.component';
import { SettingsRoutingModule } from './settings-routing.module';
import { SyncSettingsPage } from './sync/pages/sync-settings/sync-settings.page';
import { ConflictResolutionPage } from './sync/pages/conflict-resolution/conflict-resolution.page';
import { SettingsListComponent } from './list/settings-list.component';

@NgModule({
  declarations: [
    SyncSettingsPage,
    ConflictResolutionPage,
    SettingsListComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    SettingsRoutingModule,
    SyncStatusComponent,
  ]
})
export class SettingsModule { }
