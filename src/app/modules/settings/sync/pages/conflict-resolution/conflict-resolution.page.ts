import { Component, OnInit, inject } from '@angular/core';

import { SyncService } from 'src/app/core/services/sync.service';
import { OfflineStorageService } from 'src/app/core/services/offline-storage.service';
import { ConflictResolution } from 'src/app/shared/models/sync.model';
import { BaseComponent } from 'src/app/shared/base';

@Component({
  selector: 'app-conflict-resolution',
  templateUrl: './conflict-resolution.page.html',
  styleUrls: ['./conflict-resolution.page.scss'],
})
export class ConflictResolutionPage extends BaseComponent implements OnInit {
  private syncService = inject(SyncService);
  private offlineStorage = inject(OfflineStorageService);

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
          amount: 5.5,
          date: '2024-01-15',
          category: 'Food',
        },
        serverData: {
          description: 'Coffee Shop',
          amount: 5.5,
          date: '2024-01-15',
          category: 'Food & Drinks',
        },
        resolution: 'local',
        timestamp: new Date(),
      },
    ];
  }

  trackByConflictId(index: number, conflict: ConflictResolution): string {
    return conflict.entityId;
  }

  getEntityIcon(entityType: string): string {
    const icons = {
      expense: 'receipt',
      category: 'folder',
      user: 'person',
    };
    return icons[entityType as keyof typeof icons] || 'document';
  }

  getEntityTitle(conflict: ConflictResolution): string {
    const titles = {
      expense: 'SYNC.EXPENSE_CONFLICT',
      category: 'SYNC.CATEGORY_CONFLICT',
      user: 'SYNC.USER_CONFLICT',
    };
    return (
      titles[conflict.entityType as keyof typeof titles] ||
      'SYNC.UNKNOWN_CONFLICT'
    );
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  formatData(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  canMerge(conflict: ConflictResolution): boolean {
    // Simple merge logic - in reality, this would be more sophisticated
    return (
      conflict.entityType === 'expense' || conflict.entityType === 'category'
    );
  }

  selectResolution(
    conflict: ConflictResolution,
    resolution: 'local' | 'server'
  ): void {
    // Highlight the selected resolution
    console.log(`Selected ${resolution} for conflict ${conflict.entityId}`);
  }

  async showMergeDialog(conflict: ConflictResolution): Promise<void> {
    const result = await this.alertService.showPrompt({
      title: this.translateService.instant('SYNC.MERGE_DATA'),
      message: this.translateService.instant('SYNC.MERGE_DIALOG_MESSAGE'),
      inputs: [
        {
          name: 'mergedData',
          type: 'textarea',
          placeholder: this.translateService.instant('SYNC.ENTER_MERGED_DATA'),
          value: this.formatData(conflict.localData),
        },
      ],
      confirmText: this.translateService.instant('SYNC.MERGE'),
      cancelText: this.translateService.instant('COMMON.CANCEL'),
    });

    if (result) {
      try {
        const mergedData = JSON.parse(result.mergedData);
        this.resolveConflict(conflict, 'merge', mergedData);
      } catch (error) {
        this.toastService.presentErrorToast('bottom', 'SYNC.INVALID_JSON');
      }
    }
  }

  resolveConflict(
    conflict: ConflictResolution,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ): void {
    const resolutionData: ConflictResolution = {
      ...conflict,
      resolution,
      mergedData,
      timestamp: new Date(),
    };

    this.syncService.resolveConflict(resolutionData).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.conflicts = this.conflicts.filter(
            (c) => c.entityId !== conflict.entityId
          );
          this.toastService.presentSuccessToast(
            'bottom',
            'SYNC.CONFLICT_RESOLVED'
          );
        } else {
          this.toastService.presentErrorToast('bottom', 'SYNC.RESOLVE_FAILED');
        }
      },
      error: (error: any) => {
        console.error('Conflict resolution error:', error);
        this.toastService.presentErrorToast('bottom', 'SYNC.RESOLVE_ERROR');
      },
    });
  }

  async resolveAllConflicts(resolution: 'local' | 'server'): Promise<void> {
    const confirmed = await this.alertService.showConfirm({
      title: this.translateService.instant('SYNC.RESOLVE_ALL_TITLE'),
      message: this.translateService.instant('SYNC.RESOLVE_ALL_MESSAGE'),
      confirmText: this.translateService.instant('SYNC.RESOLVE_ALL'),
      cancelText: this.translateService.instant('COMMON.CANCEL'),
    });

    if (confirmed) {
      this.conflicts.forEach((conflict) => {
        this.resolveConflict(conflict, resolution);
      });
    }
  }
}
