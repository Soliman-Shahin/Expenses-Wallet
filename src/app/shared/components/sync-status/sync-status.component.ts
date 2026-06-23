import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AsyncPipe } from '@angular/common';
import { combineLatest, takeUntil, Subject } from 'rxjs';
import { SyncService } from 'src/app/core/services/sync.service';
import { ConnectionService } from 'src/app/core/services/connection.service';
import { SyncMetadata, SyncProgress } from 'src/app/shared/models/sync.model';
import { BaseComponent } from 'src/app/shared/base';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.scss'],
  imports: [IonicModule, TranslateModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncStatusComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  private syncService = inject(SyncService);
  private connectionService = inject(ConnectionService);
  private translate = inject(TranslateService);

  metadata: SyncMetadata | null = null;
  progress: SyncProgress | null = null;
  connectionStatus$ = this.connectionService.getConnectionStatus();
  showDetails = false;

  override ngOnInit(): void {
    combineLatest([
      this.syncService.syncMetadata$,
      this.syncService.syncProgress$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([metadata, progress]) => {
        this.metadata = metadata;
        this.progress = progress;
        this.cdr.markForCheck();
      });
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
    this.cdr.markForCheck();
  }

  forceSync(event?: Event): void {
    if (event) event.stopPropagation();

    this.syncService
      .forceSync()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.toastService.presentSuccessToast(
              'bottom',
              'SYNC.SYNC_SUCCESS'
            );
          } else {
            this.toastService.presentErrorToast('bottom', 'SYNC.SYNC_FAILED');
          }
        },
        error: () => {
          this.toastService.presentErrorToast('bottom', 'SYNC.SYNC_ERROR');
        },
      });
  }

  getStatusIcon(): string {
    if (!this.metadata) return 'cloud-offline-outline';
    if (this.metadata.isSyncing) return 'sync-outline';
    if (!this.metadata.isOnline) return 'cloud-offline-outline';
    if (this.metadata.conflictCount > 0) return 'warning-outline';
    if (this.metadata.errorCount > 0) return 'alert-circle-outline';
    if (this.metadata.pendingCount > 0) return 'time-outline';
    return 'checkmark-circle-outline';
  }

  getStatusKey(): string {
    if (!this.metadata) return 'SYNC.UNKNOWN';
    if (this.metadata.isSyncing) return 'SYNC.SYNCING';
    if (!this.metadata.isOnline) return 'SYNC.OFFLINE';
    if (this.metadata.conflictCount > 0) return 'SYNC.HAS_CONFLICTS';
    if (this.metadata.errorCount > 0) return 'SYNC.HAS_ERRORS';
    if (this.metadata.pendingCount > 0) return 'SYNC.PENDING_CHANGES';
    return 'SYNC.UP_TO_DATE';
  }

  getStatusClass(): string {
    if (!this.metadata) return 'state-unknown';
    if (this.metadata.isSyncing) return 'state-syncing';
    if (!this.metadata.isOnline) return 'state-offline';
    if (this.metadata.conflictCount > 0) return 'state-conflict';
    if (this.metadata.errorCount > 0) return 'state-error';
    if (this.metadata.pendingCount > 0) return 'state-pending';
    return 'state-synced';
  }

  getLastSyncTime(): string {
    if (!this.metadata?.lastSyncTime) return '';
    const now = new Date();
    const lastSync = new Date(this.metadata.lastSyncTime);
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return this.translate.instant('SYNC.JUST_NOW');
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  }

  get hasPending(): boolean {
    return (this.metadata?.pendingCount ?? 0) > 0;
  }

  get hasConflicts(): boolean {
    return (this.metadata?.conflictCount ?? 0) > 0;
  }

  get isOffline(): boolean {
    return !(this.metadata?.isOnline ?? true);
  }

  get isSyncing(): boolean {
    return this.metadata?.isSyncing ?? false;
  }
}
