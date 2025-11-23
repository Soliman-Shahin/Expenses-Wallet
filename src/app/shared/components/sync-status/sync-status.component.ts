import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, combineLatest, takeUntil } from 'rxjs';
import { SyncService } from 'src/app/core/services/sync.service';
import {
  SyncMetadata,
  SyncProgress,
  SyncStatus,
} from 'src/app/shared/models/sync.model';
import { BaseComponent } from 'src/app/shared/base';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  template: `
    <ion-item
      *ngIf="showSyncStatus"
      class="sync-status-item"
      [class.syncing]="metadata?.isSyncing"
      [class.offline]="!metadata?.isOnline"
      [class.has-conflicts]="(metadata?.conflictCount || 0) > 0"
      [class.has-errors]="(metadata?.errorCount || 0) > 0"
      button
      (click)="toggleDetails()"
    >
      <ion-icon
        slot="start"
        [name]="getStatusIcon()"
        [color]="getStatusColor()"
      >
      </ion-icon>

      <ion-label>
        <h3>{{ getStatusText() }}</h3>
        <p *ngIf="!metadata?.isSyncing && metadata?.isOnline">
          {{ 'SYNC.LAST_SYNC' | translate }}: {{ getLastSyncTime() }}
        </p>
        <p *ngIf="metadata?.isSyncing">
          {{ 'SYNC.SYNCING' | translate }}... {{ progress?.percentage || 0 }}%
        </p>
        <p *ngIf="!metadata?.isOnline">
          {{ 'SYNC.OFFLINE_MODE' | translate }}
        </p>
      </ion-label>

      <ion-badge
        *ngIf="(metadata?.pendingCount || 0) > 0"
        slot="end"
        color="warning"
      >
        {{ metadata?.pendingCount }}
      </ion-badge>

      <ion-badge
        *ngIf="(metadata?.conflictCount || 0) > 0"
        slot="end"
        color="danger"
      >
        {{ metadata?.conflictCount }}
      </ion-badge>

      <ion-button
        *ngIf="metadata?.isOnline && !metadata?.isSyncing"
        slot="end"
        fill="clear"
        size="small"
        (click)="forceSync($event)"
      >
        <ion-icon name="refresh" slot="icon-only"></ion-icon>
      </ion-button>

      <ion-icon
        slot="end"
        [name]="showDetails ? 'chevron-up' : 'chevron-down'"
        *ngIf="!metadata?.isSyncing"
      >
      </ion-icon>
    </ion-item>

    <!-- Sync Details -->
    <ion-card *ngIf="showDetails && showSyncStatus" class="sync-details-card">
      <ion-card-header>
        <ion-card-title>{{ 'SYNC.DETAILS' | translate }}</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <!-- Progress Bar -->
        <div *ngIf="metadata?.isSyncing" class="sync-progress">
          <ion-progress-bar
            [value]="(progress?.percentage || 0) / 100"
            [color]="getProgressColor()"
          >
          </ion-progress-bar>
          <p class="progress-text">
            {{ progress?.currentOperation || '' }}
          </p>
        </div>

        <!-- Sync Statistics -->
        <div class="sync-stats">
          <div class="stat-item">
            <ion-icon name="checkmark-circle" color="success"></ion-icon>
            <span
              >{{ 'SYNC.SYNCED' | translate }}:
              {{ metadata?.totalEntities || 0 }}</span
            >
          </div>

          <div class="stat-item" *ngIf="(metadata?.pendingCount || 0) > 0">
            <ion-icon name="time" color="warning"></ion-icon>
            <span
              >{{ 'SYNC.PENDING' | translate }}:
              {{ metadata?.pendingCount || 0 }}</span
            >
          </div>

          <div class="stat-item" *ngIf="(metadata?.conflictCount || 0) > 0">
            <ion-icon name="warning" color="danger"></ion-icon>
            <span
              >{{ 'SYNC.CONFLICTS' | translate }}:
              {{ metadata?.conflictCount || 0 }}</span
            >
          </div>

          <div class="stat-item" *ngIf="(metadata?.errorCount || 0) > 0">
            <ion-icon name="alert-circle" color="danger"></ion-icon>
            <span
              >{{ 'SYNC.ERRORS' | translate }}:
              {{ metadata?.errorCount || 0 }}</span
            >
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="sync-actions">
          <ion-button
            *ngIf="metadata?.isOnline && !metadata?.isSyncing"
            fill="solid"
            color="primary"
            (click)="forceSync()"
          >
            <ion-icon name="refresh" slot="start"></ion-icon>
            {{ 'SYNC.SYNC_NOW' | translate }}
          </ion-button>

          <ion-button
            *ngIf="(metadata?.conflictCount || 0) > 0"
            fill="outline"
            color="warning"
            (click)="resolveConflicts()"
          >
            <ion-icon name="construct" slot="start"></ion-icon>
            {{ 'SYNC.RESOLVE_CONFLICTS' | translate }}
          </ion-button>

          <ion-button fill="clear" color="medium" (click)="openSyncSettings()">
            <ion-icon name="settings" slot="start"></ion-icon>
            {{ 'SYNC.SETTINGS' | translate }}
          </ion-button>
        </div>

        <!-- Error Messages -->
        <div *ngIf="(progress?.errors || []).length > 0" class="sync-errors">
          <h4>{{ 'SYNC.ERRORS' | translate }}</h4>
          <ion-list>
            <ion-item *ngFor="let error of progress?.errors">
              <ion-icon
                name="alert-circle"
                color="danger"
                slot="start"
              ></ion-icon>
              <ion-label>{{ error }}</ion-label>
            </ion-item>
          </ion-list>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
      .sync-status-item {
        --background: var(--ion-color-light);
        --border-radius: 8px;
        margin: 8px;
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .sync-status-item.syncing {
        --background: var(--ion-color-primary-tint);
        animation: pulse 2s infinite;
      }

      .sync-status-item.offline {
        --background: var(--ion-color-medium-tint);
      }

      .sync-status-item.has-conflicts {
        --background: var(--ion-color-warning-tint);
      }

      .sync-status-item.has-errors {
        --background: var(--ion-color-danger-tint);
      }

      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
        100% {
          opacity: 1;
        }
      }

      .sync-details-card {
        margin: 8px;
        border-radius: 8px;
      }

      .sync-progress {
        margin-bottom: 16px;
      }

      .progress-text {
        margin-top: 8px;
        font-size: 0.9em;
        color: var(--ion-color-medium);
        text-align: center;
      }

      .sync-stats {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9em;
      }

      .sync-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }

      .sync-errors {
        margin-top: 16px;
      }

      .sync-errors h4 {
        color: var(--ion-color-danger);
        margin-bottom: 8px;
      }

      ion-badge {
        margin-left: 8px;
      }

      @media (min-width: 768px) {
        .sync-actions {
          flex-direction: row;
          justify-content: space-between;
        }

        .sync-stats {
          flex-direction: row;
          justify-content: space-around;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SyncStatusComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  private syncService = inject(SyncService);

  metadata$: Observable<SyncMetadata | null> = this.syncService.syncMetadata$;
  progress$: Observable<SyncProgress | null> = this.syncService.syncProgress$;

  metadata: SyncMetadata | null = null;
  progress: SyncProgress | null = null;
  showDetails = false;
  showSyncStatus = true;

  override ngOnInit(): void {
    // Subscribe to sync metadata and progress
    combineLatest([this.metadata$, this.progress$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([metadata, progress]) => {
        this.metadata = metadata;
        this.progress = progress;
        this.cdr.markForCheck();
      });
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  forceSync(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

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
      },
    });
  }

  resolveConflicts(): void {
    // Navigate to conflict resolution page
    this.router.navigate(['/settings/conflicts']);
  }

  openSyncSettings(): void {
    // Navigate to sync settings page
    this.router.navigate(['/settings/sync']);
  }

  getStatusIcon(): string {
    if (!this.metadata) return 'cloud-offline';

    if (this.metadata.isSyncing) return 'sync';
    if (!this.metadata.isOnline) return 'cloud-offline';
    if (this.metadata.conflictCount > 0) return 'warning';
    if (this.metadata.errorCount > 0) return 'alert-circle';
    if (this.metadata.pendingCount > 0) return 'time';

    return 'checkmark-circle';
  }

  getStatusColor(): string {
    if (!this.metadata) return 'medium';

    if (this.metadata.isSyncing) return 'primary';
    if (!this.metadata.isOnline) return 'medium';
    if (this.metadata.conflictCount > 0) return 'warning';
    if (this.metadata.errorCount > 0) return 'danger';
    if (this.metadata.pendingCount > 0) return 'warning';

    return 'success';
  }

  getStatusText(): string {
    if (!this.metadata) return 'SYNC.UNKNOWN';

    if (this.metadata.isSyncing) return 'SYNC.SYNCING';
    if (!this.metadata.isOnline) return 'SYNC.OFFLINE';
    if (this.metadata.conflictCount > 0) return 'SYNC.HAS_CONFLICTS';
    if (this.metadata.errorCount > 0) return 'SYNC.HAS_ERRORS';
    if (this.metadata.pendingCount > 0) return 'SYNC.PENDING_CHANGES';

    return 'SYNC.UP_TO_DATE';
  }

  getLastSyncTime(): string {
    if (!this.metadata?.lastSyncTime) return 'SYNC.NEVER';

    const now = new Date();
    const lastSync = new Date(this.metadata.lastSyncTime);
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'SYNC.JUST_NOW';
    if (diffMins < 60) return `SYNC.MINUTES_AGO` + ` ${diffMins}`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `SYNC.HOURS_AGO` + ` ${diffHours}`;

    const diffDays = Math.floor(diffHours / 24);
    return `SYNC.DAYS_AGO` + ` ${diffDays}`;
  }

  getProgressColor(): string {
    if (!this.progress) return 'primary';

    if (this.progress.errors.length > 0) return 'danger';
    if (this.progress.percentage < 50) return 'warning';

    return 'success';
  }
}
