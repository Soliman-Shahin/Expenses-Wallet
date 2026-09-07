import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { BackupRestoreComponent } from 'src/app/shared/components/backup-restore/backup-restore.component';

@Component({
  selector: 'app-backup-settings',
  template: `
    <ion-header mode="ios" class="settings-header" translucent="false">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button
            routerLink="/settings/list"
            class="modern-back-btn"
            [attr.aria-label]="'COMMON.BACK' | translate"
          >
            <ion-icon name="chevron-back"></ion-icon>
          </ion-button> </ion-buttons
        ><ion-title>{{ 'SETTINGS.BACKUP_RESTORE' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="settings-content" [fullscreen]="true">
      <div class="settings-container">
        <app-backup-restore></app-backup-restore>
      </div>
    </ion-content>
  `,
  styleUrls: ['backup.page.scss'],
  standalone: true,
  imports: [IonicModule, TranslateModule, BackupRestoreComponent, RouterModule],
})
export class BackupSettingsPage {}
