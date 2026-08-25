import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { BackupRestoreComponent } from 'src/app/shared/components/backup-restore/backup-restore.component';

@Component({
  selector: 'app-backup-settings',
  template: `
    <ion-header mode="ios" class="settings-header" translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button routerLink="/settings/list" class="modern-back-btn">
            <ion-icon name="chevron-back"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="settings-content" [fullscreen]="true">
      <ion-header collapse="condense" class="settings-header">
        <ion-toolbar>
          <ion-title size="large">{{ 'SETTINGS.BACKUP_RESTORE' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>
      <div class="settings-container">
        <app-backup-restore></app-backup-restore>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .settings-header {
        background: transparent !important;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      }
      .settings-header ion-toolbar {
        --background: rgba(var(--ion-background-color-rgb), 0.8) !important;
        --border-width: 0px;
      }
      .modern-back-btn {
        --padding-start: 0;
        --padding-end: 0;
        --border-radius: 50%;
        --background: rgba(var(--ion-text-color-rgb), 0.05);
        width: 40px;
        height: 40px;
        margin: 8px 12px;
        color: var(--ion-text-color);
      }
      .modern-back-btn ion-icon {
        font-size: 24px;
      }
      .settings-content {
        --background: var(--ion-background-color);
      }
      .settings-container {
        padding: 0 0 150px 0;
      }
      /* Dark mode overrides */
      :host-context(body.dark) {
        .settings-content {
          --background: var(--ion-background-color);
        }
      }
    `,
  ],
  standalone: true,
  imports: [IonicModule, TranslateModule, BackupRestoreComponent, RouterModule],
})
export class BackupSettingsPage {}
