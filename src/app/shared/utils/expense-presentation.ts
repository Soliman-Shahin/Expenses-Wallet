import { Expense } from '../models/expense.model';

// Presentation only: never infer a successful sync when metadata is absent.
export function expenseSyncLabel(expense: Expense): string | null {
  const status = (expense as Expense & { _syncStatus?: string })._syncStatus;
  const labels: Record<string, string> = {
    synced: 'SYNC.SYNCED',
    pending: 'SYNC.PENDING_SYNC',
    conflict: 'SYNC.CONFLICT_DETECTED',
    error: 'SYNC.SYNC_FAILED',
    failed: 'SYNC.SYNC_FAILED',
    offline: 'MOBILE.OFFLINE',
    syncing: 'MOBILE.SYNCING',
  };
  return status ? labels[status] || null : null;
}
