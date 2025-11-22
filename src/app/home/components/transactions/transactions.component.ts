import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  finalize,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
} from 'rxjs';
import { Expense } from 'src/app/shared/models/expense.model';
import { BaseComponent } from 'src/app/shared/base';
import { ProfileService } from 'src/app/modules/profile/services/profile.service';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { SkeletonBlockComponent } from 'src/app/shared/ui/skeleton-block/skeleton-block.component';
import { ToastController } from '@ionic/angular';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, SkeletonBlockComponent],
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TransactionsComponent extends BaseComponent implements OnChanges {
  @Input() limit: number = 5;
  @Input() month?: number;
  @Input() year?: number;

  userCurrency = 'USD';

  // UI state for popover menu per transaction
  popoverStates: { [id: string]: boolean } = {};

  private readonly refreshTrigger$ = new BehaviorSubject<void>(undefined);

  constructor(private readonly profileService: ProfileService) {
    super();
  }

  private readonly params$ = new BehaviorSubject<{
    month?: number;
    year?: number;
    limit: number;
  }>({ month: this.month, year: this.year, limit: this.limit });

  override ngOnInit(): void {
    this.loadUserCurrency();
  }

  loadUserCurrency() {
    const profile = this.profileService.getProfile();
    this.userCurrency = profile?.currency || 'USD';
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

  private readonly transactions$ = combineLatest([
    this.params$,
    this.refreshTrigger$,
  ]).pipe(
    switchMap(([params]) => {
      this.setLoading(true);
      return this.expenseService.getExpenses().pipe(
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

          filtered.sort((a, b) => {
            const dateA = (a as any)?.date || (a as any)?.createdAt;
            const dateB = (b as any)?.date || (b as any)?.createdAt;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            const da = new Date(dateA).getTime();
            const db = new Date(dateB).getTime();
            if (isNaN(da) && isNaN(db)) return 0;
            if (isNaN(da)) return 1;
            if (isNaN(db)) return -1;
            return db - da;
          });

          return filtered.slice(0, Math.max(0, params.limit || 5));
        }),
        catchError((error) => {
          this.handleError('Failed to load transactions', error, true);
          return of([]);
        }),
        finalize(() => this.setLoading(false))
      );
    }),
    shareReplay(1)
  );

  readonly vm$ = combineLatest({
    transactions: this.transactions$,
    loading: toObservable(this.state.loading),
    error: toObservable(this.state.error),
  });

  // Method to manually refresh transactions
  refreshTransactions(): void {
    this.refreshTrigger$.next();
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

  // Category color if available, with a fallback
  // Helper to check if popover is open for a transaction
  isPopoverOpen(id: string): boolean {
    return !!this.popoverStates[id];
  }

  // Open popover for a transaction
  openPopover(id: string, event: Event) {
    event.stopPropagation();
    this.popoverStates = { ...this.popoverStates, [id]: true };
  }

  // Close popover for a transaction
  closePopover(id: string) {
    this.popoverStates = { ...this.popoverStates, [id]: false };
  }

  getCategoryColor(t: Expense): string {
    const cat = (t as any)?.category;
    const color = (cat as any)?.color;
    // Provide a fallback color to prevent template errors if color is null/undefined
    return typeof color === 'string' && color
      ? color
      : 'var(--ion-color-primary)';
  }

  getDateValue(t: Expense): string | number | Date | null | undefined {
    const v = (t as any)?.date ?? (t as any)?.createdAt;
    return v as any;
  }

  getAmountValue(t: Expense): number | null | undefined {
    const n = Number((t as any)?.amount);
    return isNaN(n) ? 0 : n;
  }

  getCategoryType(t: Expense): 'income' | 'expense' {
    const cat = (t as any)?.category;
    const type = (cat as any)?.type;
    return type === 'income' ? 'income' : 'expense';
  }

  onTransactionClick(item: Expense) {
    this.onEdit(item);
  }

  async onAddTransaction() {
    const modal = await this.modalCtrl.create({
      component: ExpenseFormComponent,
      cssClass: 'main-modal',
    });
    await modal.present();

    const { role } = await modal.onDidDismiss();
    if (role === 'confirm') {
      this.refreshTransactions();
    }
  }

  async onEdit(item: Expense) {
    const modal = await this.modalCtrl.create({
      component: ExpenseFormComponent,
      componentProps: {
        expense: item,
      },
      cssClass: 'main-modal',
    });
    await modal.present();

    const { role } = await modal.onDidDismiss();
    if (role === 'confirm') {
      this.refreshTransactions();
    }
  }

  async onDelete(item: Expense) {
    const transactionName = this.getOperationName(item);
    const confirmed = await this.alertService.showDeleteConfirm(
      transactionName,
      async () => {
        this.expenseService.deleteExpense((item as any)._id).subscribe({
          next: async () => {
            this.toastService.presentSuccessToast(
              'bottom',
              'Transaction deleted successfully'
            );
            this.refreshTransactions();
          },
          error: async (err) => {
            this.toastService.presentErrorToast(
              'bottom',
              'Error deleting transaction. Please try again.'
            );
            console.error(err);
          },
        });
      }
    );
  }
}
