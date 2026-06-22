import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController } from '@ionic/angular';

import { SyncService } from 'src/app/core/services/sync.service';
import { OfflineStorageService } from 'src/app/core/services/offline-storage.service';
import { SyncConfig } from 'src/app/shared/models/sync.model';
import { BaseComponent } from 'src/app/shared/base';

@Component({
  selector: 'app-sync-settings',
  template: `
    <ion-header mode="ios">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/settings/list"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ 'SYNC.SETTINGS_TITLE' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="settings-content" [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ 'SYNC.SETTINGS_TITLE' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <form [formGroup]="syncForm" (ngSubmit)="saveSettings()" class="settings-container">
        
        <div class="section-label">{{ 'SYNC.AUTO_SYNC' | translate }}</div>
        <ion-list inset="true" class="premium-list">
          <ion-item>
            <div slot="start" class="icon-wrapper color-cyan">
              <ion-icon name="sync"></ion-icon>
            </div>
            <ion-label>
              <h3>{{ 'SYNC.ENABLE_AUTO_SYNC' | translate }}</h3>
              <p>{{ 'SYNC.AUTO_SYNC_DESC' | translate }}</p>
            </ion-label>
            <ion-toggle formControlName="autoSync" slot="end" color="success"></ion-toggle>
          </ion-item>

          <ion-item *ngIf="syncForm.get('autoSync')?.value">
            <ion-label>{{ 'SYNC.SYNC_INTERVAL' | translate }}</ion-label>
            <ion-select formControlName="syncInterval" interface="popover" slot="end" class="modern-select">
              <ion-select-option value="10000">{{ 'SYNC.EVERY_10_SECONDS' | translate }}</ion-select-option>
              <ion-select-option value="30000">{{ 'SYNC.EVERY_30_SECONDS' | translate }}</ion-select-option>
              <ion-select-option value="60000">{{ 'SYNC.EVERY_MINUTE' | translate }}</ion-select-option>
              <ion-select-option value="300000">{{ 'SYNC.EVERY_5_MINUTES' | translate }}</ion-select-option>
              <ion-select-option value="900000">{{ 'SYNC.EVERY_15_MINUTES' | translate }}</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <div class="section-label">{{ 'SYNC.CONFLICT_RESOLUTION' | translate }}</div>
        <ion-list inset="true" class="premium-list">
          <ion-item>
            <ion-label>{{ 'SYNC.CONFLICT_STRATEGY' | translate }}</ion-label>
            <ion-select formControlName="conflictResolution" interface="popover" slot="end" class="modern-select">
              <ion-select-option value="prompt">{{ 'SYNC.ASK_ME' | translate }}</ion-select-option>
              <ion-select-option value="local">{{ 'SYNC.USE_LOCAL' | translate }}</ion-select-option>
              <ion-select-option value="server">{{ 'SYNC.USE_SERVER' | translate }}</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <div slot="start" class="icon-wrapper color-purple">
              <ion-icon name="cloud-offline"></ion-icon>
            </div>
            <ion-label>
              <h3>{{ 'SYNC.OFFLINE_MODE' | translate }}</h3>
              <p>{{ 'SYNC.OFFLINE_MODE_DESC' | translate }}</p>
            </ion-label>
            <ion-toggle formControlName="enableOfflineMode" slot="end" color="success"></ion-toggle>
          </ion-item>
        </ion-list>

        <div class="section-label">{{ 'SYNC.ADVANCED' | translate }}</div>
        <ion-list inset="true" class="premium-list">
          <ion-item>
            <ion-label>{{ 'SYNC.MAX_RETRIES' | translate }}</ion-label>
            <ion-input type="number" formControlName="maxRetries" min="1" max="10" slot="end" class="right-align-input"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label>{{ 'SYNC.BATCH_SIZE' | translate }}</ion-label>
            <ion-input type="number" formControlName="batchSize" min="1" max="50" slot="end" class="right-align-input"></ion-input>
          </ion-item>
        </ion-list>

        <div class="section-label">{{ 'SYNC.STORAGE_INFO' | translate }}</div>
        <ion-list inset="true" class="premium-list">
          <ion-item>
            <div slot="start" class="icon-wrapper color-dark">
              <ion-icon name="folder"></ion-icon>
            </div>
            <ion-label>
              <h3>{{ 'SYNC.LOCAL_STORAGE' | translate }}</h3>
              <p>{{ storageSize | async | number : '1.2-2' }} KB</p>
            </ion-label>
          </ion-item>

          <ion-item>
            <div slot="start" class="icon-wrapper color-orange">
              <ion-icon name="cloud-upload"></ion-icon>
            </div>
            <ion-label>
              <h3>{{ 'SYNC.PENDING_SYNC' | translate }}</h3>
              <p>{{ pendingCount | async }} {{ 'SYNC.ITEMS' | translate }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <div class="ion-padding">
          <ion-button expand="block" type="submit" class="ion-margin-bottom">
            <ion-icon name="save-outline" slot="start"></ion-icon>
            {{ 'COMMON.SAVE' | translate }}
          </ion-button>

          <ion-button expand="block" fill="outline" (click)="forceSync()" class="ion-margin-bottom">
            <ion-icon name="sync-outline" slot="start"></ion-icon>
            {{ 'SYNC.SYNC_NOW' | translate }}
          </ion-button>

          <ion-button expand="block" fill="outline" color="warning" (click)="createBackup()" class="ion-margin-bottom">
            <ion-icon name="download-outline" slot="start"></ion-icon>
            {{ 'SYNC.CREATE_BACKUP' | translate }}
          </ion-button>

          <ion-button expand="block" fill="outline" color="danger" (click)="clearOfflineData()">
            <ion-icon name="trash-outline" slot="start"></ion-icon>
            {{ 'SYNC.CLEAR_OFFLINE_DATA' | translate }}
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    .settings-content { --background: var(--ion-color-step-50, #f2f2f6); }
    .settings-container { padding: 0 0 100px 0; }
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
      margin-bottom: 24px;
      border-radius: 12px;
      background: var(--ion-item-background, #ffffff);
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    }
    .premium-list ion-item {
      --padding-start: 16px;
      --inner-padding-end: 16px;
      --min-height: 60px;
    }
    .premium-list ion-item h3 { font-weight: 500; font-size: 16px; letter-spacing: -0.2px; }
    .premium-list ion-item p { font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; }
    .icon-wrapper {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      margin-inline-end: 16px;
    }
    .icon-wrapper ion-icon { font-size: 20px; color: #ffffff; }
    .color-cyan { background: #32ade6; }
    .color-purple { background: #5856d6; }
    .color-dark { background: #8e8e93; }
    .modern-select { width: 100%; max-width: 150px; justify-content: flex-end; color: var(--ion-color-medium); }
    .right-align-input { text-align: end; }
    :host-context(body.dark) .settings-content { --background: #000000; }
    :host-context(body.dark) .section-label { color: #98989d; }
    :host-context(body.dark) .premium-list { background: #1c1c1e; box-shadow: none; }
  `]
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
      syncInterval: [config.syncInterval?.toString() ?? '10000'],
      conflictResolution: [config.conflictResolution ?? 'prompt'],
      enableOfflineMode: [false],
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
      spinner: 'circles'
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
        message: this.translateService.instant('COMMON.LOADING') || 'Clearing...',
        spinner: 'circles'
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
      message: this.translateService.instant('SYNC.CREATING_BACKUP') || 'Creating Backup...',
      spinner: 'circles'
    });
    await loading.present();

    this.offlineStorage.createBackup().subscribe({
      next: (backup) => {
        loading.dismiss();
        if (backup) {
          try {
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expenses_backup_${new Date().toISOString().split('T')[0]}.json`;
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
