import { Component, OnInit, inject } from '@angular/core';

import { SyncService } from 'src/app/core/services/sync.service';
import { OfflineStorageService } from 'src/app/core/services/offline-storage.service';
import { ConflictResolution } from 'src/app/shared/models/sync.model';
import { BaseComponent } from 'src/app/shared/base';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-conflict-resolution',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/sync/settings"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ 'SYNC.CONFLICT_RESOLUTION' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- No Conflicts Message -->
      <div *ngIf="conflicts.length === 0" class="no-conflicts">
        <ion-icon name="checkmark-circle" color="success"></ion-icon>
        <h2>{{ 'SYNC.NO_CONFLICTS' | translate }}</h2>
        <p>{{ 'SYNC.NO_CONFLICTS_DESC' | translate }}</p>
      </div>

      <!-- Conflicts List -->
      <div *ngIf="conflicts.length > 0">
        <ion-card *ngFor="let conflict of conflicts; trackBy: trackByConflictId" class="conflict-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon [name]="getEntityIcon(conflict.entityType)" color="warning"></ion-icon>
              {{ getEntityTitle(conflict) }}
            </ion-card-title>
            <ion-card-subtitle>
              {{ 'SYNC.CONFLICT_DETECTED' | translate }}: {{ formatDate(conflict.timestamp) }}
            </ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <!-- Conflict Details -->
            <div class="conflict-details">
              <div class="data-comparison">
                <!-- Local Data -->
                <div class="data-section local-data">
                  <h4>
                    <ion-icon name="phone-portrait" color="primary"></ion-icon>
                    {{ 'SYNC.LOCAL_VERSION' | translate }}
                  </h4>
                  <div class="data-content">
                    <pre>{{ formatData(conflict.localData) }}</pre>
                  </div>
                  <ion-button 
                    fill="outline" 
                    color="primary" 
                    size="small"
                    (click)="selectResolution(conflict, 'local')">
                    {{ 'SYNC.USE_THIS' | translate }}
                  </ion-button>
                </div>

                <!-- Server Data -->
                <div class="data-section server-data">
                  <h4>
                    <ion-icon name="cloud" color="secondary"></ion-icon>
                    {{ 'SYNC.SERVER_VERSION' | translate }}
                  </h4>
                  <div class="data-content">
                    <pre>{{ formatData(conflict.serverData) }}</pre>
                  </div>
                  <ion-button 
                    fill="outline" 
                    color="secondary" 
                    size="small"
                    (click)="selectResolution(conflict, 'server')">
                    {{ 'SYNC.USE_THIS' | translate }}
                  </ion-button>
                </div>
              </div>

              <!-- Merge Option -->
              <div class="merge-option" *ngIf="canMerge(conflict)">
                <h4>
                  <ion-icon name="git-merge" color="tertiary"></ion-icon>
                  {{ 'SYNC.MERGE_OPTION' | translate }}
                </h4>
                <p>{{ 'SYNC.MERGE_DESC' | translate }}</p>
                <ion-button 
                  fill="outline" 
                  color="tertiary" 
                  size="small"
                  (click)="showMergeDialog(conflict)">
                  {{ 'SYNC.MERGE_DATA' | translate }}
                </ion-button>
              </div>
            </div>

            <!-- Resolution Actions -->
            <div class="resolution-actions">
              <ion-button 
                fill="solid" 
                color="success"
                (click)="resolveConflict(conflict, 'local')">
                <ion-icon name="checkmark" slot="start"></ion-icon>
                {{ 'SYNC.RESOLVE_LOCAL' | translate }}
              </ion-button>

              <ion-button 
                fill="solid" 
                color="secondary"
                (click)="resolveConflict(conflict, 'server')">
                <ion-icon name="cloud-done" slot="start"></ion-icon>
                {{ 'SYNC.RESOLVE_SERVER' | translate }}
              </ion-button>

              <ion-button 
                *ngIf="canMerge(conflict)"
                fill="solid" 
                color="tertiary"
                (click)="resolveConflict(conflict, 'merge')">
                <ion-icon name="git-merge" slot="start"></ion-icon>
                {{ 'SYNC.RESOLVE_MERGE' | translate }}
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Bulk Actions -->
        <ion-card class="bulk-actions">
          <ion-card-header>
            <ion-card-title>{{ 'SYNC.BULK_ACTIONS' | translate }}</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="bulk-buttons">
              <ion-button 
                fill="outline" 
                color="primary"
                (click)="resolveAllConflicts('local')">
                <ion-icon name="phone-portrait" slot="start"></ion-icon>
                {{ 'SYNC.USE_ALL_LOCAL' | translate }}
              </ion-button>

              <ion-button 
                fill="outline" 
                color="secondary"
                (click)="resolveAllConflicts('server')">
                <ion-icon name="cloud" slot="start"></ion-icon>
                {{ 'SYNC.USE_ALL_SERVER' | translate }}
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: var(--ion-color-light);
    }

    .no-conflicts {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .no-conflicts ion-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .no-conflicts h2 {
      margin: 0 0 8px 0;
      color: var(--ion-color-success);
    }

    .no-conflicts p {
      margin: 0;
      color: var(--ion-color-medium);
    }

    .conflict-card {
      margin: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .conflict-card ion-card-header {
      padding-bottom: 8px;
    }

    .conflict-card ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1em;
    }

    .conflict-details {
      margin-bottom: 16px;
    }

    .data-comparison {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 16px;
    }

    .data-section {
      border: 1px solid var(--ion-color-light-shade);
      border-radius: 8px;
      padding: 12px;
      background: var(--ion-color-light-tint);
    }

    .data-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px 0;
      font-size: 0.9em;
      font-weight: 600;
    }

    .data-content {
      margin-bottom: 8px;
    }

    .data-content pre {
      background: var(--ion-color-light);
      padding: 8px;
      border-radius: 4px;
      font-size: 0.8em;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .merge-option {
      border: 1px solid var(--ion-color-tertiary-tint);
      border-radius: 8px;
      padding: 12px;
      background: var(--ion-color-tertiary-tint);
    }

    .merge-option h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px 0;
      font-size: 0.9em;
      font-weight: 600;
    }

    .merge-option p {
      margin: 0 0 8px 0;
      font-size: 0.8em;
      color: var(--ion-color-medium);
    }

    .resolution-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bulk-actions {
      margin: 16px;
      border-radius: 12px;
    }

    .bulk-buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    @media (min-width: 768px) {
      .data-comparison {
        flex-direction: row;
      }

      .data-section {
        flex: 1;
      }

      .resolution-actions {
        flex-direction: row;
        justify-content: space-between;
      }

      .bulk-buttons {
        flex-direction: row;
        justify-content: space-between;
      }
    }
  `]
})
export class ConflictResolutionPage extends BaseComponent implements OnInit {
  private syncService = inject(SyncService);
  private offlineStorage = inject(OfflineStorageService);

  private alertCtrl = inject(AlertController);

  conflicts: ConflictResolution[] = [];

  override ngOnInit(): void {
    this.loadConflicts();
  }

  private loadConflicts(): void {
    // In a real implementation, you would get conflicts from the sync service
    // For now, we'll simulate some conflicts
    this.conflicts = [
      {
        entityId: '1',
        entityType: 'expense',
        localData: {
          description: 'Coffee',
          amount: 5.50,
          date: '2024-01-15',
          category: 'Food'
        },
        serverData: {
          description: 'Coffee Shop',
          amount: 5.50,
          date: '2024-01-15',
          category: 'Food & Drinks'
        },
        resolution: 'local',
        timestamp: new Date()
      }
    ];
  }

  trackByConflictId(index: number, conflict: ConflictResolution): string {
    return conflict.entityId;
  }

  getEntityIcon(entityType: string): string {
    const icons = {
      'expense': 'receipt',
      'category': 'folder',
      'user': 'person'
    };
    return icons[entityType as keyof typeof icons] || 'document';
  }

  getEntityTitle(conflict: ConflictResolution): string {
    const titles = {
      'expense': 'SYNC.EXPENSE_CONFLICT',
      'category': 'SYNC.CATEGORY_CONFLICT',
      'user': 'SYNC.USER_CONFLICT'
    };
    return titles[conflict.entityType as keyof typeof titles] || 'SYNC.UNKNOWN_CONFLICT';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatData(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  canMerge(conflict: ConflictResolution): boolean {
    // Simple merge logic - in reality, this would be more sophisticated
    return conflict.entityType === 'expense' || conflict.entityType === 'category';
  }

  selectResolution(conflict: ConflictResolution, resolution: 'local' | 'server'): void {
    // Highlight the selected resolution
    console.log(`Selected ${resolution} for conflict ${conflict.entityId}`);
  }

  showMergeDialog(conflict: ConflictResolution): void {
    // Show a dialog for manual merging
    this.alertCtrl.create({
      header: 'SYNC.MERGE_DATA',
      message: 'SYNC.MERGE_DIALOG_MESSAGE',
      inputs: [
        {
          name: 'mergedData',
          type: 'textarea',
          placeholder: 'SYNC.ENTER_MERGED_DATA',
          value: this.formatData(conflict.localData)
        }
      ],
      buttons: [
        {
          text: 'COMMON.CANCEL',
          role: 'cancel'
        },
        {
          text: 'SYNC.MERGE',
          handler: (data) => {
            try {
              const mergedData = JSON.parse(data.mergedData);
              this.resolveConflict(conflict, 'merge', mergedData);
            } catch (error) {
              this.toastService.presentErrorToast('bottom','SYNC.INVALID_JSON');
            }
          }
        }
      ]
    }).then(alert => alert.present());
  }

  resolveConflict(conflict: ConflictResolution, resolution: 'local' | 'server' | 'merge', mergedData?: any): void {
    const resolutionData: ConflictResolution = {
      ...conflict,
      resolution,
      mergedData,
      timestamp: new Date()
    };

    this.syncService.resolveConflict(resolutionData).subscribe({
      next: (success) => {
        if (success) {
          this.conflicts = this.conflicts.filter(c => c.entityId !== conflict.entityId);
          this.toastService.presentSuccessToast('bottom','SYNC.CONFLICT_RESOLVED');
        } else {
          this.toastService.presentErrorToast('bottom','SYNC.RESOLVE_FAILED');
        }
      },
      error: (error) => {
        console.error('Conflict resolution error:', error);
        this.toastService.presentErrorToast('bottom','SYNC.RESOLVE_ERROR');
      }
    });
  }

  resolveAllConflicts(resolution: 'local' | 'server'): void {
    this.alertCtrl.create({
      header: 'SYNC.RESOLVE_ALL_TITLE',
      message: 'SYNC.RESOLVE_ALL_MESSAGE',
      buttons: [
        {
          text: 'COMMON.CANCEL',
          role: 'cancel'
        },
        {
          text: 'SYNC.RESOLVE_ALL',
          handler: () => {
            this.conflicts.forEach(conflict => {
              this.resolveConflict(conflict, resolution);
            });
          }
        }
      ]
    }).then((alert: HTMLIonAlertElement) => alert.present());
  }
}
