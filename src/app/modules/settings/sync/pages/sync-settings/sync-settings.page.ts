import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { SyncService } from 'src/app/core/services/sync.service';
import { OfflineStorageService } from 'src/app/core/services/offline-storage.service';
import { SyncConfig } from 'src/app/shared/models/sync.model';
import { BaseComponent } from 'src/app/shared/base';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-sync-settings',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ 'SYNC.SETTINGS_TITLE' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form [formGroup]="syncForm" (ngSubmit)="saveSettings()">
        <!-- Auto Sync Settings -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ 'SYNC.AUTO_SYNC' | translate }}</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <ion-item>
              <ion-toggle 
                formControlName="autoSync"
                slot="start">
              </ion-toggle>
              <ion-label>
                <h3>{{ 'SYNC.ENABLE_AUTO_SYNC' | translate }}</h3>
                <p>{{ 'SYNC.AUTO_SYNC_DESC' | translate }}</p>
              </ion-label>
            </ion-item>

            <ion-item *ngIf="syncForm.get('autoSync')?.value">
              <ion-label position="stacked">
                {{ 'SYNC.SYNC_INTERVAL' | translate }}
              </ion-label>
              <ion-select formControlName="syncInterval" interface="popover">
                <ion-select-option value="10000">{{ 'SYNC.EVERY_10_SECONDS' | translate }}</ion-select-option>
                <ion-select-option value="30000">{{ 'SYNC.EVERY_30_SECONDS' | translate }}</ion-select-option>
                <ion-select-option value="60000">{{ 'SYNC.EVERY_MINUTE' | translate }}</ion-select-option>
                <ion-select-option value="300000">{{ 'SYNC.EVERY_5_MINUTES' | translate }}</ion-select-option>
                <ion-select-option value="900000">{{ 'SYNC.EVERY_15_MINUTES' | translate }}</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Conflict Resolution -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ 'SYNC.CONFLICT_RESOLUTION' | translate }}</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">
                {{ 'SYNC.CONFLICT_STRATEGY' | translate }}
              </ion-label>
              <ion-select formControlName="conflictResolution" interface="popover">
                <ion-select-option value="prompt">{{ 'SYNC.ASK_ME' | translate }}</ion-select-option>
                <ion-select-option value="local">{{ 'SYNC.USE_LOCAL' | translate }}</ion-select-option>
                <ion-select-option value="server">{{ 'SYNC.USE_SERVER' | translate }}</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-toggle 
                formControlName="enableOfflineMode"
                slot="start">
              </ion-toggle>
              <ion-label>
                <h3>{{ 'SYNC.OFFLINE_MODE' | translate }}</h3>
                <p>{{ 'SYNC.OFFLINE_MODE_DESC' | translate }}</p>
              </ion-label>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Advanced Settings -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ 'SYNC.ADVANCED' | translate }}</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">
                {{ 'SYNC.MAX_RETRIES' | translate }}
              </ion-label>
              <ion-input 
                type="number" 
                formControlName="maxRetries"
                min="1" 
                max="10">
              </ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">
                {{ 'SYNC.BATCH_SIZE' | translate }}
              </ion-label>
              <ion-input 
                type="number" 
                formControlName="batchSize"
                min="1" 
                max="50">
              </ion-input>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Storage Information -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ 'SYNC.STORAGE_INFO' | translate }}</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="storage-info">
              <div class="storage-item">
                <ion-icon name="folder" color="primary"></ion-icon>
                <div>
                  <h4>{{ 'SYNC.LOCAL_STORAGE' | translate }}</h4>
                  <p>{{ storageSize | async | number:'1.2-2' }} KB</p>
                </div>
              </div>

              <div class="storage-item">
                <ion-icon name="cloud" color="secondary"></ion-icon>
                <div>
                  <h4>{{ 'SYNC.PENDING_SYNC' | translate }}</h4>
                  <p>{{ pendingCount | async }} {{ 'SYNC.ITEMS' | translate }}</p>
                </div>
              </div>
            </div>

            <div class="storage-actions">
              <ion-button 
                fill="outline" 
                color="warning"
                (click)="clearOfflineData()">
                <ion-icon name="trash" slot="start"></ion-icon>
                {{ 'SYNC.CLEAR_OFFLINE_DATA' | translate }}
              </ion-button>

              <ion-button 
                fill="outline" 
                color="primary"
                (click)="createBackup()">
                <ion-icon name="download" slot="start"></ion-icon>
                {{ 'SYNC.CREATE_BACKUP' | translate }}
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <ion-button 
            type="submit" 
            expand="block" 
            color="primary"
            [disabled]="!syncForm.valid">
            <ion-icon name="save" slot="start"></ion-icon>
            {{ 'SYNC.SAVE_SETTINGS' | translate }}
          </ion-button>

          <ion-button 
            expand="block" 
            fill="outline" 
            color="primary"
            (click)="forceSync()">
            <ion-icon name="refresh" slot="start"></ion-icon>
            {{ 'SYNC.SYNC_NOW' | translate }}
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: var(--ion-color-light);
    }

    ion-card {
      margin: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    ion-card-header {
      padding-bottom: 8px;
    }

    ion-card-title {
      font-size: 1.2em;
      font-weight: 600;
      color: var(--ion-color-primary);
    }

    ion-item {
      --background: transparent;
      --border-radius: 8px;
      margin-bottom: 8px;
    }

    .storage-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 16px;
    }

    .storage-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--ion-color-light-tint);
      border-radius: 8px;
    }

    .storage-item ion-icon {
      font-size: 24px;
    }

    .storage-item h4 {
      margin: 0 0 4px 0;
      font-size: 1em;
      font-weight: 600;
    }

    .storage-item p {
      margin: 0;
      font-size: 0.9em;
      color: var(--ion-color-medium);
    }

    .storage-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-buttons {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    @media (min-width: 768px) {
      .storage-actions {
        flex-direction: row;
        justify-content: space-between;
      }
    }
  `]
})
export class SyncSettingsPage extends BaseComponent implements OnInit {
  private syncService = inject(SyncService);
  private offlineStorage = inject(OfflineStorageService);
  private formBuilder = inject(FormBuilder);

  private alertController = inject(AlertController);

  syncForm!: FormGroup;
  storageSize = this.offlineStorage.getStorageSize();
  pendingCount = this.syncService.getPendingCount();

  override ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentSettings();
  }

  private initializeForm(): void {
    this.syncForm = this.formBuilder.group({
      autoSync: [true, Validators.required],
      syncInterval: [30000, Validators.required],
      conflictResolution: ['prompt', Validators.required],
      enableOfflineMode: [true, Validators.required],
      maxRetries: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      batchSize: [10, [Validators.required, Validators.min(1), Validators.max(50)]]
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
        batchSize: formValue.batchSize
      };

      this.syncService.updateConfig(config);
      this.toastService.presentSuccessToast('bottom', 'SYNC.SETTINGS_SAVED');
    }
  }

  forceSync(): void {
    this.syncService.forceSync().subscribe({
      next: (success) => {
        if (success) {
          this.toastService.presentSuccessToast('bottom', 'SYNC.SYNC_SUCCESS');
        } else {
          this.toastService.presentErrorToast('bottom', 'SYNC.SYNC_FAILED');
        }
      },
      error: (error) => {
        console.error('Sync error:', error);
        this.toastService.presentErrorToast('bottom', 'SYNC.SYNC_ERROR');
      }
    });
  }

  clearOfflineData(): void {
    this.alertController.create({
      header: 'SYNC.CLEAR_DATA_TITLE',
      message: 'SYNC.CLEAR_DATA_MESSAGE',
      buttons: [
        {
          text: 'COMMON.CANCEL',
          role: 'cancel'
        },
        {
          text: 'COMMON.DELETE',
          role: 'destructive',
          handler: () => {
            this.offlineStorage.clearOfflineData().subscribe({
              next: (success) => {
                if (success) {
                  this.toastService.presentSuccessToast('bottom', 'SYNC.DATA_CLEARED');
                } else {
                  this.toastService.presentErrorToast('bottom', 'SYNC.CLEAR_FAILED');
                }
              },
              error: (error) => {
                console.error('Clear data error:', error);
                this.toastService.presentErrorToast('bottom', 'SYNC.CLEAR_ERROR');
              }
            });
          }
        }
      ]
    }).then(alert => alert.present());
  }

  createBackup(): void {
    this.offlineStorage.createBackup().subscribe({
      next: (backup) => {
        if (backup) {
          // In a real app, you would save this to a file or cloud storage
          console.log('Backup created:', backup);
          this.toastService.presentSuccessToast('bottom', 'SYNC.BACKUP_CREATED');
        } else {
          this.toastService.presentErrorToast('bottom', 'SYNC.BACKUP_FAILED');
        }
      },
      error: (error) => {
        console.error('Backup error:', error);
        this.toastService.presentErrorToast('bottom', 'SYNC.BACKUP_ERROR');
      }
    });
  }
}
