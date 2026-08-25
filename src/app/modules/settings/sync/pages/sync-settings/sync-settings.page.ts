import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { LoadingController, IonicModule } from '@ionic/angular';

import { SyncService } from 'src/app/core/services/sync.service';
import { OfflineStorageService } from 'src/app/core/services/offline-storage.service';
import { SyncConfig } from 'src/app/shared/models/sync.model';
import { BaseComponent } from 'src/app/shared/base';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sync-settings',
  template: `
    <ion-header mode="ios" class="settings-header" translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button routerLink="/settings/list" class="modern-back-btn">
            <ion-icon name="chevron-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ 'SYNC.SETTINGS_TITLE' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="settings-content" [fullscreen]="true">
      <ion-header collapse="condense" class="settings-header">
        <ion-toolbar>
          <ion-title size="large">{{
            'SYNC.SETTINGS_TITLE' | translate
          }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <form
        [formGroup]="syncForm"
        (ngSubmit)="saveSettings()"
        class="settings-container"
      >
        <div class="section-label">{{ 'SYNC.AUTO_SYNC' | translate }}</div>
        <ion-list inset="true" class="premium-list">
      <ion-item lines="none">
            <div slot="start" class="icon-wrapper color-cyan">
              <ion-icon name="sync"></ion-icon>
            </div>
            <ion-label>
              <h3>{{ 'SYNC.ENABLE_AUTO_SYNC' | translate }}</h3>
              <p>{{ 'SYNC.AUTO_SYNC_DESC' | translate }}</p>
            </ion-label>
            <ion-toggle
              formControlName="autoSync"
              slot="end"
              color="success"
            ></ion-toggle>
          </ion-item>

          @if (syncForm.get('autoSync')?.value) {
      <ion-item lines="none">
            <div slot="start" class="icon-wrapper color-blue">
              <ion-icon name="time"></ion-icon>
            </div>
            <ion-label>{{ 'SYNC.SYNC_INTERVAL' | translate }}</ion-label>
            <ion-select
              formControlName="syncInterval"
              interface="popover"
              slot="end"
              class="modern-select"
            >
              <ion-select-option value="60000">{{
                'SYNC.EVERY_MINUTE' | translate
              }}</ion-select-option>
              <ion-select-option value="300000">{{
                'SYNC.EVERY_5_MINUTES' | translate
              }}</ion-select-option>
              <ion-select-option value="900000">{{
                'SYNC.EVERY_15_MINUTES' | translate
              }}</ion-select-option>
            </ion-select>
          </ion-item>
          }
        </ion-list>

        <div class="section-label">
          {{ 'SYNC.CONFLICT_RESOLUTION' | translate }}
        </div>
        <ion-list inset="true" class="premium-list">
      <ion-item lines="none">
            <div slot="start" class="icon-wrapper color-red">
              <ion-icon name="git-compare"></ion-icon>
            </div>
            <ion-label>{{ 'SYNC.CONFLICT_STRATEGY' | translate }}</ion-label>
            <ion-select
              formControlName="conflictResolution"
              interface="popover"
              slot="end"
              class="modern-select"
            >
              <ion-select-option value="prompt">{{
                'SYNC.ASK_ME' | translate
              }}</ion-select-option>
              <ion-select-option value="local">{{
                'SYNC.USE_LOCAL' | translate
              }}</ion-select-option>
              <ion-select-option value="server">{{
                'SYNC.USE_SERVER' | translate
              }}</ion-select-option>
            </ion-select>
          </ion-item>

      <ion-item lines="none">
            <div slot="start" class="icon-wrapper color-purple">
              <ion-icon name="cloud-offline"></ion-icon>
            </div>
            <ion-label>
              <h3>{{ 'SYNC.OFFLINE_MODE' | translate }}</h3>
              <p>{{ 'SYNC.OFFLINE_MODE_DESC' | translate }}</p>
            </ion-label>
            <ion-toggle
              formControlName="enableOfflineMode"
              slot="end"
              color="success"
            ></ion-toggle>
          </ion-item>
        </ion-list>

        <div class="section-label">{{ 'SYNC.ADVANCED' | translate }}</div>
        <ion-list inset="true" class="premium-list">
      <ion-item lines="none">
            <div slot="start" class="icon-wrapper color-orange">
              <ion-icon name="refresh-circle"></ion-icon>
            </div>
            <ion-label>{{ 'SYNC.MAX_RETRIES' | translate }}</ion-label>
            <ion-input
              type="number"
              formControlName="maxRetries"
              min="1"
              max="10"
              slot="end"
              class="right-align-input"
            ></ion-input>
          </ion-item>

          <ion-item lines="none">
            <div slot="start" class="icon-wrapper color-green">
              <ion-icon name="layers"></ion-icon>
            </div>
            <ion-label>{{ 'SYNC.BATCH_SIZE' | translate }}</ion-label>
            <ion-input
              type="number"
              formControlName="batchSize"
              min="1"
              max="50"
              slot="end"
              class="right-align-input"
            ></ion-input>
          </ion-item>
        </ion-list>

        <div class="section-label">{{ 'SYNC.STORAGE_INFO' | translate }}</div>
        <ion-list inset="true" class="premium-list">
      <ion-item lines="none">
            <div slot="start" class="icon-wrapper color-dark">
              <ion-icon name="folder"></ion-icon>
            </div>
            <ion-label>
              <h3>{{ 'SYNC.LOCAL_STORAGE' | translate }}</h3>
              <p>{{ storageSize | async | number : '1.2-2' }} KB</p>
            </ion-label>
          </ion-item>

      <ion-item lines="none">
            <div slot="start" class="icon-wrapper color-orange">
              <ion-icon name="cloud-upload"></ion-icon>
            </div>
            <ion-label>
              <h3>{{ 'SYNC.PENDING_SYNC' | translate }}</h3>
              <p>{{ pendingCount | async }} {{ 'SYNC.ITEMS' | translate }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <div class="ion-padding action-buttons-container">
          <ion-button expand="block" type="submit" class="action-button btn-primary">
            <ion-icon name="save-outline" slot="start"></ion-icon>
            {{ 'COMMON.SAVE' | translate }}
          </ion-button>

          <ion-button
            expand="block"
            class="action-button btn-outline btn-outline-primary"
            (click)="forceSync()"
          >
            <ion-icon name="sync-outline" slot="start"></ion-icon>
            {{ 'SYNC.SYNC_NOW' | translate }}
          </ion-button>

          <ion-button
            expand="block"
            class="action-button btn-outline btn-outline-warning"
            (click)="createBackup()"
          >
            <ion-icon name="download-outline" slot="start"></ion-icon>
            {{ 'SYNC.CREATE_BACKUP' | translate }}
          </ion-button>

          <ion-button
            expand="block"
            class="action-button btn-outline btn-outline-danger"
            (click)="clearOfflineData()"
          >
            <ion-icon name="trash-outline" slot="start"></ion-icon>
            {{ 'SYNC.CLEAR_OFFLINE_DATA' | translate }}
          </ion-button>
        </div>
      </form>
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
      .section-label {
        margin: 20px 20px 8px;
        margin-inline-start: 32px;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--ion-color-medium);
        letter-spacing: 0.5px;
      }
      .premium-list {
        margin: 0 16px 24px 16px;
        padding: 0 !important;
        border-radius: 24px;
        overflow: hidden;
        background: var(--glass-background, rgba(255, 255, 255, 0.7));
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.18);
      }
      .premium-list ion-item {
        --background: transparent;
        --padding-start: 16px;
        --inner-padding-end: 16px;
        --min-height: 64px;
        border-bottom: 1px solid rgba(var(--ion-text-color-rgb), 0.05);
        margin-bottom: 0 !important;
      }
      .premium-list ion-item:last-child {
        border-bottom: none;
      }
      .premium-list ion-item h3 {
        font-weight: 600;
        font-size: 16px;
        letter-spacing: -0.2px;
      }
      .premium-list ion-item p {
        font-size: 13px;
        color: var(--ion-color-medium);
        margin-top: 4px;
      }
      .icon-wrapper {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-inline-end: 16px;
      }
      .icon-wrapper ion-icon {
        font-size: 20px;
        color: #ffffff;
      }
      .color-cyan { background: #32ade6; }
      .color-purple { background: #5856d6; }
      .color-dark { background: #8e8e93; }
      .color-orange { background: #ff9500; }
      .color-blue { background: #007aff; }
      .color-red { background: #ff3b30; }
      .color-green { background: #34c759; }
      .modern-select {
        width: 100%;
        max-width: 150px;
        justify-content: flex-end;
        color: var(--ion-color-medium);
      }
      .right-align-input {
        text-align: end;
      }
      .action-buttons-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 24px 16px;
      }
      .action-button {
        margin: 0;
        --border-radius: 16px;
        height: 56px;
        font-weight: 600;
        font-size: 16px;
        letter-spacing: 0.3px;
      }
      .btn-primary {
        --background: var(--brand-gradient, linear-gradient(135deg, #007aff, #5856d6));
        --box-shadow: 0 8px 16px rgba(0, 122, 255, 0.25);
        --color: white;
      }
      .btn-outline {
        --border-width: 1.5px;
        --border-style: solid;
        --background: transparent;
      }
      .btn-outline-primary {
        --border-color: rgba(var(--ion-color-primary-rgb), 0.3);
        --color: var(--ion-color-primary);
      }
      .btn-outline-warning {
        --border-color: rgba(var(--ion-color-warning-rgb), 0.4);
        --color: var(--ion-color-warning);
      }
      .btn-outline-danger {
        --border-color: rgba(var(--ion-color-danger-rgb), 0.3);
        --color: var(--ion-color-danger);
      }
      /* Dark mode overrides */
      :host-context(body.dark) {
        .settings-content {
          --background: var(--ion-background-color);
        }
        .section-label {
          color: var(--ew-color-gray-500);
        }
        .premium-list {
          background: rgba(22, 28, 42, 0.6);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .premium-list ion-item {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .premium-list ion-item:last-child {
          border-bottom: none;
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,
    DecimalPipe,
    TranslateModule,
    RouterModule,
  ],
})
export class SyncSettingsPage extends BaseComponent implements OnInit {
  private syncService = inject(SyncService);
  private offlineStorage = inject(OfflineStorageService);
  private formBuilder = inject(FormBuilder);
  private loadingController = inject(LoadingController);

  syncForm!: FormGroup;
  storageSize = this.offlineStorage.getStorageSize();
  pendingCount = this.syncService.getPendingCount();

  override ngOnInit() {
    super.ngOnInit();
    const config = this.syncService.getConfig();
    this.syncForm = this.formBuilder.group({
      autoSync: [config.autoSync ?? true],
      syncInterval: [config.syncInterval?.toString() ?? '300000'],
      conflictResolution: [config.conflictResolution ?? 'prompt'],
      enableOfflineMode: [config.enableOfflineMode ?? false],
      maxRetries: [
        config.maxRetries ?? 3,
        [Validators.required, Validators.min(1), Validators.max(10)],
      ],
      batchSize: [
        config.batchSize ?? 50,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
    });
  }

  private loadCurrentSettings(): void {
    const config = this.syncService.getConfig();
    this.syncForm.patchValue(config);
  }

  saveSettings(): void {
    if (this.syncForm.valid) {
      const formValue = this.syncForm.value;
      const config: Partial<SyncConfig> = {
        autoSync: formValue.autoSync,
        syncInterval: parseInt(formValue.syncInterval),
        conflictResolution: formValue.conflictResolution,
        enableOfflineMode: formValue.enableOfflineMode,
        maxRetries: formValue.maxRetries,
        batchSize: formValue.batchSize,
      };

      this.syncService.updateConfig(config);
      this.toastService.presentSuccessToast('bottom', 'SYNC.SETTINGS_SAVED');
    }
  }

  async forceSync(): Promise<void> {
    const loading = await this.loadingController.create({
      message: this.translateService.instant('SYNC.SYNCING') || 'Syncing...',
      spinner: 'circles',
    });
    await loading.present();

    this.syncService.forceSync().subscribe({
      next: (success) => {
        loading.dismiss();
        if (success) {
          this.toastService.presentSuccessToast('bottom', 'SYNC.SYNC_SUCCESS');
        } else {
          this.toastService.presentErrorToast('bottom', 'SYNC.SYNC_FAILED');
        }
      },
      error: (error) => {
        loading.dismiss();
        console.error('Sync error:', error);
        this.toastService.presentErrorToast('bottom', 'SYNC.SYNC_ERROR');
      },
    });
  }

  async clearOfflineData(): Promise<void> {
    const confirmed = await this.alertService.showConfirm({
      title: this.translateService.instant('SYNC.CLEAR_DATA_TITLE'),
      message: this.translateService.instant('SYNC.CLEAR_DATA_MESSAGE'),
      confirmText: this.translateService.instant('COMMON.DELETE'),
      cancelText: this.translateService.instant('COMMON.CANCEL'),
    });

    if (confirmed) {
      const loading = await this.loadingController.create({
        message:
          this.translateService.instant('COMMON.LOADING') || 'Clearing...',
        spinner: 'circles',
      });
      await loading.present();

      this.offlineStorage.clearOfflineData().subscribe({
        next: (success) => {
          loading.dismiss();
          if (success) {
            this.toastService.presentSuccessToast(
              'bottom',
              'SYNC.DATA_CLEARED'
            );
          } else {
            this.toastService.presentErrorToast('bottom', 'SYNC.CLEAR_FAILED');
          }
        },
        error: (error) => {
          loading.dismiss();
          console.error('Clear data error:', error);
          this.toastService.presentErrorToast('bottom', 'SYNC.CLEAR_ERROR');
        },
      });
    }
  }

  async createBackup(): Promise<void> {
    const loading = await this.loadingController.create({
      message:
        this.translateService.instant('SYNC.CREATING_BACKUP') ||
        'Creating Backup...',
      spinner: 'circles',
    });
    await loading.present();

    this.offlineStorage.createBackup().subscribe({
      next: (backup) => {
        loading.dismiss();
        if (backup) {
          try {
            const blob = new Blob([JSON.stringify(backup, null, 2)], {
              type: 'application/json',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expenses_backup_${
              new Date().toISOString().split('T')[0]
            }.json`;
            a.click();
            window.URL.revokeObjectURL(url);

            this.toastService.presentSuccessToast(
              'bottom',
              'SYNC.BACKUP_CREATED'
            );
          } catch (e) {
            console.error('Error downloading backup:', e);
            this.toastService.presentErrorToast('bottom', 'SYNC.BACKUP_ERROR');
          }
        } else {
          this.toastService.presentErrorToast('bottom', 'SYNC.BACKUP_FAILED');
        }
      },
      error: (error) => {
        loading.dismiss();
        console.error('Backup error:', error);
        this.toastService.presentErrorToast('bottom', 'SYNC.BACKUP_ERROR');
      },
    });
  }
}
