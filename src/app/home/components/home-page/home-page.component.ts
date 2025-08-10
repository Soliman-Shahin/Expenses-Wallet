import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BaseComponent } from 'src/app/shared/base';
import { MonthYear } from '../../models';
import { User } from 'src/app/modules/auth/models';
import {
  combineLatest,
  BehaviorSubject,
  of,
  map,
  startWith,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
  catchError,
} from 'rxjs';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { DashboardFacade } from 'src/app/shared/facades';
import { formatCurrency } from 'src/app/shared/utils';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

// Constants
const MAX_RETRY_ATTEMPTS = 3;

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent extends BaseComponent implements OnInit {
  selectedMonth: MonthYear = this.getCurrentMonthYear();
  currentDate: Date = new Date();
  // Keep simple fallbacks where needed
  percentageChange: number | null = null;
  currency: string = 'USD';

  // UI state
  activeTab: 'charts' | 'summary' = 'summary';
  // Local loading flags to avoid flipping the whole page
  isDashboardLoading = false;
  isTransactionsLoading = false;
  // Use global loading only for the initial load to unblock the page content
  private _useGlobalLoadingOnce = true;

  // Scroll position state
  isScrolledToStart = true;
  isScrolledToEnd = false;

  // Header configuration
  private headerConfig = {
    title: 'HOME.TITLE',
    icon: 'home-outline',
  };

  // Card interaction states
  cardStates: { [key: string]: boolean } = {
    balance: false,
    income: false,
    expenses: false,
    salary: false,
    quickActions: false,
    monthlySummary: false,
    recentTransactions: false,
  };

  constructor() {
    super();
  }

  private readonly ionModal = inject(ModalController);

  // Facade and VM
  private readonly dashboard = inject(DashboardFacade);

  // Reactive month selection for totals
  private readonly monthSelection$ = new BehaviorSubject<MonthYear>(
    this.selectedMonth
  );

  // Auth state for UI
  isLoggedIn$ = inject(AuthService).user$.pipe(map((u) => !!u));
  private readonly totalsByMonth$ = this.monthSelection$.pipe(
    switchMap((m) =>
      combineLatest([
        this.dashboard.totalsForMonth(m.month, m.year),
        this.dashboard.profile$.pipe(startWith(null)),
      ]).pipe(
        map(([t, profile]) => {
          const base = t ?? { income: 0, expenses: 0, balance: 0 };
          const salaryDetails = Array.isArray((profile as any)?.salary)
            ? (profile as any).salary
            : [];
          const totalSalary = salaryDetails.reduce(
            (sum: number, item: any) => sum + (Number(item?.amount) || 0),
            0
          );
          if ((base.income ?? 0) === 0 && totalSalary > 0) {
            const income = totalSalary;
            const expenses = base.expenses ?? 0;
            return { income, expenses, balance: income - expenses } as const;
          }
          return base as { income: number; expenses: number; balance: number };
        }),
        switchMap((res) =>
          res && (res.income !== 0 || res.expenses !== 0)
            ? of(res)
            : this.dashboard.totals$
        )
      )
    ),
    startWith({ income: 0, expenses: 0, balance: 0 } as const)
  );
  private readonly expenseByCategoryByMonth$ = this.monthSelection$.pipe(
    switchMap((m) => this.dashboard.expenseByCategoryForMonth(m.month, m.year)),
    startWith([] as any[])
  );
  private readonly monthlyExpensesByMonth$ = this.monthSelection$.pipe(
    switchMap((m) => this.dashboard.monthlyExpensesForMonth(m.month, m.year)),
    startWith([] as any[])
  );
  // Derive income vs expenses for the selected month from totalsByMonth$
  private readonly incomeVsExpenseByMonth$ = this.totalsByMonth$.pipe(
    map((t) => [
      { name: 'Income', value: t.income },
      { name: 'Expenses', value: t.expenses },
    ])
  );

  readonly vm$ = combineLatest({
    profile: this.dashboard.profile$.pipe(startWith(null)),
    incomeVsExpense: this.incomeVsExpenseByMonth$,
    expenseByCategory: this.expenseByCategoryByMonth$,
    monthlyExpenses: this.monthlyExpensesByMonth$,
    totals: this.totalsByMonth$,
  }).pipe(
    map((s) => {
      const salaryDetails = Array.isArray(s.profile?.salary)
        ? s.profile!.salary
        : [];
      const totalSalary = salaryDetails.reduce(
        (sum: number, item: any) => sum + (Number(item?.amount) || 0),
        0
      );
      const salaryBreakdown = salaryDetails
        .map((d: any) => {
          const rawName = (d?.title ?? d?.name ?? d?.label ?? '').toString();
          const name = rawName.trim();
          const value = Number(d?.amount) || 0;
          return { name, value };
        })
        .filter((x) => x.value > 0);
      return {
        ...s,
        salaryDetails,
        salaryBreakdown,
        totalSalary,
        currency: s.profile?.currency ?? this.currency,
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  // trackBy helpers
  trackByIndex(index: number): number {
    return index;
  }

  formatAmount(amount: number | null | undefined): string {
    return formatCurrency(amount ?? 0, this.currency);
  }

  // Switch between Charts and Summary tabs
  setActiveTab(tab: string | number | null | undefined) {
    // Normalize to a valid key; default to 'charts'
    const val = tab != null ? String(tab) : '';
    this.activeTab = val === 'summary' ? 'summary' : 'charts';
    try {
      localStorage.setItem('home.activeTab', this.activeTab);
    } catch {}
    this.cdr.markForCheck();
  }

  get displayUsername(): string {
    return this.user?.['username'] || 'User';
  }

  /**
   * Initializes the component with additional setup
   */
  override ngOnInit(): void {
    super.ngOnInit();
    // Restore last selected tab
    try {
      const savedTab = localStorage.getItem('home.activeTab');
      if (savedTab === 'summary' || savedTab === 'charts') {
        this.activeTab = savedTab;
      }
    } catch {}
    this.setupRouteDataSubscription();
  }

  /**
   * Handles month change from the month selector
   */
  onMonthChange(monthYear: MonthYear): void {
    this.selectedMonth = monthYear;
    // Notify reactive totals stream
    this.monthSelection$.next(monthYear);
  }

  /**
   * Handles scroll events from the months scroll header
   */
  onMonthScroll(event: { isAtStart: boolean; isAtEnd: boolean }): void {
    this.isScrolledToStart = event.isAtStart;
    this.isScrolledToEnd = event.isAtEnd;
    this.cdr.markForCheck();
  }

  /**
   * Handles user data changes
   */
  protected override onUserChanged(user: User | null): void {
    super.onUserChanged(user);
    this.setError(null);
    this.cdr.markForCheck();
  }

  /**
   * Gets current month and year
   */
  private getCurrentMonthYear(): MonthYear {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }

  /**
   * Sets up subscription to route data changes
   */
  private setupRouteDataSubscription(): void {
    this.activatedRoute.data
      .pipe(
        takeUntil(this.destroy$),
        tap((data: any) => {
          this.headerConfig = { ...this.headerConfig, ...data };
        }),
        catchError((error) => {
          console.error('Error loading route data:', error);
          this.toastService.presentErrorToast(
            'bottom',
            'COMMON.ERRORS.LOAD_DATA'
          );
          return of(null);
        })
      )
      .subscribe();
  }

  // Card interaction methods
  onCardHover(cardName: string, isHovering: boolean) {
    this.cardStates[cardName] = isHovering;
    this.cdr.markForCheck();
  }

  onCardClick(cardName: string) {
    // Add specific click behavior for each card if needed
    console.log(`${cardName} card clicked`);

    // Trigger a subtle animation
    this.cardStates[cardName] = true;
    setTimeout(() => (this.cardStates[cardName] = false), 150);
  }

  // Retry handler from template: re-emit current month to refresh streams
  retry(): void {
    this.monthSelection$.next({ ...this.selectedMonth });
  }

  // FAB: open expense form modal
  async openExpenseModal(): Promise<void> {
    try {
      const modal = await this.ionModal.create({
        component: ExpenseFormComponent,
        componentProps: {
          month: this.selectedMonth.month,
          year: this.selectedMonth.year,
        },
        presentingElement: document.querySelector('ion-router-outlet') as
          | HTMLElement
          | undefined,
      });
      await modal.present();
    } catch (err) {
      console.error('Failed to open expense modal', err);
      this.toastService?.presentErrorToast('bottom', 'COMMON.ERRORS.DEFAULT');
    }
  }

  /**
   * Loads transactions for the selected month and year
   */
  private loadTransactionsForMonth(month: number, year: number): void {
    this.isTransactionsLoading = true;
    // TODO: implement real fetch; keep UI responsive without flipping whole page
    // Example (when implementing): call service, then set isTransactionsLoading=false in finalize.
    this.isTransactionsLoading = false;
    this.cdr.markForCheck();
  }
}
