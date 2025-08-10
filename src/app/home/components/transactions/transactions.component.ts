import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
} from 'rxjs';
import { Expense } from 'src/app/shared/models/expense.model';
import { ExpenseService } from 'src/app/core/services/expense.service';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TransactionsComponent implements OnChanges {
  @Input() limit: number = 5;
  @Input() month?: number;
  @Input() year?: number;

  constructor(private readonly expenses: ExpenseService) {}

  private readonly params$ = new BehaviorSubject<{
    month?: number;
    year?: number;
    limit: number;
  }>({ month: this.month, year: this.year, limit: this.limit });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['month'] || changes['year'] || changes['limit']) {
      this.params$.next({
        month: this.month,
        year: this.year,
        limit: this.limit,
      });
    }
  }

  readonly transactions$: Observable<Expense[]> = this.params$.pipe(
    // avoid redundant recomputes
    distinctUntilChanged(
      (a, b) => a.month === b.month && a.year === b.year && a.limit === b.limit
    ),
    switchMap((params) =>
      this.expenses.getExpenses().pipe(
        map((resp) => {
          const arr: Expense[] = Array.isArray(resp)
            ? (resp as Expense[])
            : (resp as any)?.data?.data || (resp as any)?.data || [];
          const filtered = arr.filter((e) => {
            const rawDate = (e as any)?.date || (e as any)?.createdAt;
            if (!rawDate) return false;
            const d = new Date(rawDate);
            if (params.month && params.year) {
              return (
                d.getMonth() + 1 === params.month &&
                d.getFullYear() === params.year
              );
            }
            return true;
          });
          filtered.sort((a, b) => {
            const da = new Date(
              (a as any)?.date || (a as any)?.createdAt
            ).getTime();
            const db = new Date(
              (b as any)?.date || (b as any)?.createdAt
            ).getTime();
            return db - da;
          });
          return filtered.slice(0, Math.max(0, params.limit | 0));
        }),
        startWith([] as Expense[])
      )
    )
  );

  trackById(_: number, item: Expense) {
    return (item as any)?._id || (item as any)?.id || item;
  }

  // Template helpers to avoid union type issues in pipes
  getTitle(t: Expense): string {
    return (t as any)?.title || (t as any)?.name || '—';
  }

  // Preferred display name for the operation/transaction
  getOperationName(t: Expense): string {
    return (
      (t as any)?.description || (t as any)?.title || (t as any)?.name || '—'
    );
  }

  // Category display name (handles populated object or falls back when string ID)
  getCategoryName(t: Expense): string {
    const cat = (t as any)?.category;
    if (!cat) return '—';
    if (typeof cat === 'string') {
      // Could be an ID; show placeholder until populated
      return '—';
    }
    return (cat as any)?.name || '—';
  }

  // Category icon (supports different category shapes); falls back to type-based or a default icon
  getCategoryIcon(t: Expense): string {
    const cat = (t as any)?.category;
    const icon = (cat as any)?.icon || (cat as any)?.iconName;
    if (icon && typeof icon === 'string') return icon;
    const type = (cat as any)?.type as 'income' | 'expense' | undefined;
    if (type === 'income') return 'arrow-down-circle-outline';
    if (type === 'expense') return 'arrow-up-circle-outline';
    return 'pricetag-outline';
  }

  // Category color if available
  getCategoryColor(t: Expense): string | null {
    const cat = (t as any)?.category;
    const color = (cat as any)?.color;
    return typeof color === 'string' ? color : null;
  }

  getDateValue(t: Expense): string | number | Date | null | undefined {
    const v = (t as any)?.date ?? (t as any)?.createdAt;
    return v as any;
  }

  getAmountValue(t: Expense): number | null | undefined {
    const n = Number((t as any)?.amount);
    return isNaN(n) ? 0 : n;
  }
}
