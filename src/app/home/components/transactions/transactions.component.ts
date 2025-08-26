import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
  takeUntil,
  Subject,
  timer,
} from 'rxjs';
import { Expense } from 'src/app/shared/models/expense.model';
import { ExpenseService } from 'src/app/core/services/expense.service';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TransactionsComponent implements OnChanges, OnDestroy {
  @Input() limit: number = 5;
  @Input() month?: number;
  @Input() year?: number;

  private readonly destroy$ = new Subject<void>();
  private readonly refreshTrigger$ = new BehaviorSubject<number>(0);

  constructor(private readonly expenses: ExpenseService) {}

  private readonly params$ = new BehaviorSubject<{
    month?: number;
    year?: number;
    limit: number;
  }>({ month: this.month, year: this.year, limit: this.limit });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['month'] || changes['year'] || changes['limit']) {
      this.params$.next({
        month: this.month,
        year: this.year,
        limit: this.limit,
      });
    }
  }

  readonly state$ = this.params$.pipe(
    distinctUntilChanged(
      (prev, curr) =>
        prev.month === curr.month &&
        prev.year === curr.year &&
        prev.limit === curr.limit
    ),
    switchMap((params) =>
      // Combine params changes with refresh trigger and periodic refresh
      this.refreshTrigger$.pipe(
        switchMap(() =>
          this.expenses.getExpenses().pipe(
            map((resp) => {
              const arr: Expense[] = Array.isArray(resp)
                ? resp
                : (resp as any)?.data?.data || (resp as any)?.data || [];

              const filtered = arr.filter((e) => {
                const rawDate = (e as any)?.date || (e as any)?.createdAt;
                if (!rawDate) return false;
                const d = new Date(rawDate);
                return params.month && params.year
                  ? d.getMonth() + 1 === params.month &&
                      d.getFullYear() === params.year
                  : true;
              });

              // Enhanced sorting: newest first (descending by date)
              filtered.sort((a, b) => {
                const dateA = (a as any)?.date || (a as any)?.createdAt;
                const dateB = (b as any)?.date || (b as any)?.createdAt;
                
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                
                const da = new Date(dateA).getTime();
                const db = new Date(dateB).getTime();
                
                // If dates are invalid, sort by creation order
                if (isNaN(da) && isNaN(db)) return 0;
                if (isNaN(da)) return 1;
                if (isNaN(db)) return -1;
                
                return db - da; // Newest first
              });

              const finalData = filtered.slice(0, Math.max(0, params.limit || 5));
              return { loading: false, data: finalData, error: null };
            }),
            startWith({ loading: true, data: [], error: null }),
            catchError((error) =>
              of({ loading: false, data: [], error: error.message })
            )
          )
        )
      )
    ),
    takeUntil(this.destroy$)
  );

  // Method to manually refresh transactions
  refreshTransactions(): void {
    this.refreshTrigger$.next(Date.now());
  }


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
