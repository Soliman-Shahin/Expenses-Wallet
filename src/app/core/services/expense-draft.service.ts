import { Injectable } from '@angular/core';

export interface ExpenseDraft {
  type: 'income' | 'outcome';
  amount: number | null;
  category: string | null;
  description: string;
  date: string;
  savedAt: number;
}

@Injectable({ providedIn: 'root' })
export class ExpenseDraftService {
  private readonly prefix = 'ewallet.transaction-draft.v1.';

  private key(ownerId: string | null): string | null {
    return ownerId ? `${this.prefix}${ownerId}` : null;
  }

  get(ownerId: string | null): ExpenseDraft | null {
    const key = this.key(ownerId);
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const draft = JSON.parse(raw) as Partial<ExpenseDraft>;
      if (
        (draft.type !== 'income' && draft.type !== 'outcome') ||
        typeof draft.date !== 'string' ||
        Number.isNaN(new Date(draft.date).getTime()) ||
        typeof draft.description !== 'string' ||
        (draft.amount !== null &&
          draft.amount !== undefined &&
          (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) < 0))
      )
        return null;
      return {
        type: draft.type,
        amount: draft.amount == null ? null : Number(draft.amount),
        category: typeof draft.category === 'string' ? draft.category : null,
        description: draft.description,
        date: new Date(draft.date).toISOString(),
        savedAt: Number.isFinite(draft.savedAt) ? Number(draft.savedAt) : 0,
      };
    } catch {
      return null;
    }
  }

  save(ownerId: string | null, value: Omit<ExpenseDraft, 'savedAt'>): void {
    const key = this.key(ownerId);
    if (!key) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ ...value, savedAt: Date.now() })
      );
    } catch {
      /* storage is optional */
    }
  }

  clear(ownerId: string | null): void {
    const key = this.key(ownerId);
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage is optional */
    }
  }
}
