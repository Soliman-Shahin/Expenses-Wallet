import { Component, OnInit, inject } from '@angular/core';

import { SyncService } from 'src/app/core/services/sync.service';
import { ConflictResolution } from 'src/app/shared/models/sync.model';
import { BaseComponent } from 'src/app/shared/base';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';

interface ConflictField {
  key: string;
  label: string;
  local: string;
  current: string;
  localValue: any;
  currentValue: any;
  changed: boolean;
}

@Component({
  selector: 'app-conflict-resolution',
  templateUrl: './conflict-resolution.page.html',
  styleUrls: ['./conflict-resolution.page.scss'],
  standalone: true,
  imports: [IonicModule, TranslateModule],
})
export class ConflictResolutionPage extends BaseComponent implements OnInit {
  private syncService = inject(SyncService);

  conflicts: ConflictResolution[] = [];
  mergeConflict: ConflictResolution | null = null;
  mergeSelection: Record<string, 'local' | 'current'> = {};
  private readonly resolvingConflictIds = new Set<string>();

  override ngOnInit(): void {
    this.loadConflicts();
  }

  private loadConflicts(): void {
    this.syncService
      .getConflicts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conflicts) => {
          this.conflicts = conflicts as ConflictResolution[];
          this.cdr.markForCheck();
        },
        error: () => {
          this.toastService.presentErrorToast('bottom', 'SYNC.RESOLVE_ERROR');
        },
      });
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

  getConflictIdentity(conflict: ConflictResolution): string {
    const local = conflict.localData || {};
    const current = conflict.serverData || {};
    if (conflict.entityType === 'expense') {
      const value =
        typeof local.description === 'string' && local.description.trim()
          ? local.description
          : current.description;
      return typeof value === 'string' ? value.trim() : '';
    }
    if (conflict.entityType === 'category') {
      const value =
        typeof local.title === 'string' && local.title.trim()
          ? local.title
          : current.title;
      return typeof value === 'string' ? value.trim() : '';
    }
    return '';
  }

  getDifferenceLabel(conflict: ConflictResolution): string {
    const key =
      this.getConflictFields(conflict).length === 1
        ? 'SYNC.ONE_DIFFERENCE'
        : 'SYNC.MANY_DIFFERENCES';
    return this.translateService.instant(key, {
      count: this.getConflictFields(conflict).length,
    });
  }

  getConflictFields(conflict: ConflictResolution): ConflictField[] {
    const definitions: Record<string, Array<{ key: string; label: string }>> = {
      expense: [
        { key: 'amount', label: 'SYNC.FIELD_AMOUNT' },
        { key: 'description', label: 'SYNC.FIELD_DESCRIPTION' },
        { key: 'category', label: 'SYNC.FIELD_CATEGORY' },
        { key: 'date', label: 'SYNC.FIELD_DATE' },
      ],
      category: [
        { key: 'title', label: 'SYNC.FIELD_TITLE' },
        { key: 'type', label: 'SYNC.FIELD_TYPE' },
        { key: 'order', label: 'SYNC.FIELD_ORDER' },
        { key: 'icon', label: 'SYNC.FIELD_ICON' },
        { key: 'color', label: 'SYNC.FIELD_COLOR' },
      ],
    };
    const fields = definitions[conflict.entityType] || [];
    return fields
      .map(({ key, label }) => {
        const localValue = conflict.localData?.[key];
        const currentValue = conflict.serverData?.[key];
        return {
          key,
          label,
          localValue,
          currentValue,
          local: this.formatFieldValue(key, localValue),
          current: this.formatFieldValue(key, currentValue),
          changed:
            JSON.stringify(localValue ?? null) !==
            JSON.stringify(currentValue ?? null),
        };
      })
      .filter((field) => field.changed);
  }

  private formatFieldValue(key: string, value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    if (key === 'amount' && typeof value === 'number') {
      return new Intl.NumberFormat(this.translateService.currentLang || 'en', {
        maximumFractionDigits: 2,
      }).format(value);
    }
    if (key === 'date') return this.formatDate(value);
    if (key === 'category' && typeof value === 'object')
      return String(value.title || '—');
    if (typeof value === 'object') return '—';
    return String(value);
  }

  formatDate(value: Date | string | unknown): string {
    const date = value instanceof Date ? value : new Date(String(value ?? ''));
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(this.translateService.currentLang || 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  formatData(data: any): string {
    return '';
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
    conflict.resolution = resolution;
    this.cdr.markForCheck();
  }

  showMergeDialog(conflict: ConflictResolution): void {
    this.mergeConflict = conflict;
    this.mergeSelection = {};
    this.getConflictFields(conflict).forEach(
      (field) => (this.mergeSelection[field.key] = 'local')
    );
    this.cdr.markForCheck();
  }

  selectMergeValue(field: string, value: unknown): void {
    if (value === 'local' || value === 'current')
      this.mergeSelection[field] = value;
  }

  applyMerge(): void {
    if (!this.mergeConflict) return;
    const mergedData = { ...this.mergeConflict.serverData };
    this.getConflictFields(this.mergeConflict).forEach((field) => {
      mergedData[field.key] =
        this.mergeSelection[field.key] === 'current'
          ? field.currentValue
          : field.localValue;
    });
    const conflict = this.mergeConflict;
    this.mergeConflict = null;
    this.resolveConflict(conflict, 'merge', mergedData);
  }

  resolveConflict(
    conflict: ConflictResolution,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ): void {
    const conflictKey = String(conflict.conflictId || conflict.entityId || '');
    if (!conflictKey || this.resolvingConflictIds.has(conflictKey)) return;
    this.resolvingConflictIds.add(conflictKey);

    const resolutionData: ConflictResolution = {
      ...conflict,
      resolution,
      mergedData,
      timestamp: new Date(),
    };

    this.syncService.resolveConflict(resolutionData).subscribe({
      next: (success: boolean) => {
        this.resolvingConflictIds.delete(conflictKey);
        if (success) {
          this.conflicts = this.conflicts.filter(
            (c) => c.entityId !== conflict.entityId
          );
          this.mergeConflict = null;
          this.toastService.presentSuccessToast(
            'bottom',
            'SYNC.CONFLICT_RESOLVED'
          );
        } else {
          this.toastService.presentErrorToast('bottom', 'SYNC.RESOLVE_FAILED');
        }
      },
      error: () => {
        this.resolvingConflictIds.delete(conflictKey);
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
