import { animate, style, transition, trigger } from '@angular/animations';
import { createInjectors } from './create-injectors';
import {
  Injector,
  inject,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Observable, defer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { AddFabButtonComponent } from 'src/app/shared/ui/add-fab-button/add-fab-button.component';
import { SyncStatusComponent } from 'src/app/shared/components/sync-status/sync-status.component';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { TransactionsComponent } from '../transactions/transactions.component';
import { ReactiveFormsModule } from '@angular/forms';
import { formatCurrency } from 'src/app/shared/utils';
import { MonthYear } from '../../models';
import {
  DateRange,
  DateRangeSelectorComponent,
} from 'src/app/shared/components/ui/date-range-selector/date-range-selector.component';
import { BaseComponent } from 'src/app/shared/base';
import {
  SectionHeaderComponent,
  SkeletonBlockComponent,
} from 'src/app/shared/ui';
import { User } from 'src/app/modules/auth/models';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { DashboardFacade } from 'src/app/shared/facades';
import { Expense } from 'src/app/shared/models';
import { BalanceCardComponent } from 'src/app/shared/components/balance-card/balance-card.component';
import { MonthsScrollHeaderComponent } from 'src/app/shared/components/months-scroll-header/months-scroll-header.component';

@Component({
  standalone: true,
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    IonicModule,
    
    ReactiveFormsModule,
    TranslateModule,
    TransactionsComponent,
    DateRangeSelectorComponent,
    AddFabButtonComponent,
    SkeletonBlockComponent,
    SectionHeaderComponent,
    BalanceCardComponent,
    MonthsScrollHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tabAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class HomePageComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  // Lazy-loaded chart component references
  barChartComponent: Observable<any> = defer(() =>
    import(
      'src/app/shared/components/charts/bar-chart/bar-chart.component'
    ).then((m) => m.BarChartComponent)
  );
  pieChartComponent: Observable<any> = defer(() =>
    import(
      'src/app/shared/components/charts/pie-chart/pie-chart.component'
    ).then((m) => m.PieChartComponent)
  );
  lineChartComponent: Observable<any> = defer(() =>
    import(
      'src/app/shared/components/charts/line-chart/line-chart.component'
    ).then((m) => m.LineChartComponent)
  );

  private _injector = inject(Injector);

  barChartInjector!: Injector;
  pieChartInjector!: Injector;
  lineChartInjector!: Injector;
  salaryBreakdownPieChartInjector!: Injector;

  latestVm: any;

  // Subscribe to vm$ for latest values (for injectors)
  // (Removed duplicate ngOnInit here)

  @ViewChild('transactionsComponent')
  transactionsComponent?: TransactionsComponent;
  selectedMonth: MonthYear = this.getCurrentMonthYear();
  currentDate: Date = new Date();
  // Keep simple fallbacks where needed
  percentageChange: number | null = null;
  selectedRange: DateRange = '1m';
  currency: string = 'USD';

  // UI state
  activeTab: 'charts' | 'summary' = 'summary';

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

  // Reactive month selection for Summary tab (current month only)
  private readonly summaryMonthSelection$ = new BehaviorSubject<MonthYear>(
    this.selectedMonth
  );

  // Reactive month selection for Charts tab (supports custom date ranges)
  private readonly chartsMonthSelection$ = new BehaviorSubject<MonthYear>({
    ...this.selectedMonth,
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 6, new Date().getDate()).toISOString(),
    endDate: new Date().toISOString()
  });

  private readonly dashboard = inject(DashboardFacade);

  createInjectors = createInjectors;

  // Auth state for UI
  protected override readonly authService = inject(AuthService);

  private readonly dashboardProfile$ = this.authService.user$.pipe(
    switchMap((user) => {
      if (!user) {
        return of(null);
      }
      return this.dashboard.profile$.pipe(
        switchMap((profile) => {
          if (profile) {
            return of(profile);
          }
          return this.dashboard.profile
            .fetchProfile()
            .pipe(catchError(() => of(null)));
        })
      );
    }),
    shareReplay(1)
  );

  // Totals for Summary tab (always current month)
  private readonly totalsByMonth$ = combineLatest([
    this.summaryMonthSelection$,
    this.dashboardProfile$,
  ]).pipe(
    switchMap(([month, profile]) => {
      if (!profile) {
        return of({ income: 0, expenses: 0, balance: 0 });
      }
      
      // Summary tab always uses month/year (no custom ranges)
      const totals$ = this.dashboard.totalsForMonth(month.month, month.year);
      
      return totals$.pipe(
        map((totals) => {
          const base = totals ?? { income: 0, expenses: 0, balance: 0 };
          const salaryDetails = Array.isArray(profile?.salary)
            ? profile.salary
            : [];
          const totalSalary = salaryDetails.reduce(
            (sum, item) => sum + (Number(item?.amount) || 0),
            0
          );

          if ((base.income ?? 0) === 0 && totalSalary > 0) {
            const income = totalSalary;
            const expenses = base.expenses ?? 0;
            return { income, expenses, balance: income - expenses };
          }
          return base;
        })
      );
    }),
    catchError(() => of({ income: 0, expenses: 0, balance: 0 })),
    shareReplay(1)
  );

  // Totals for Charts tab (supports custom date ranges)
  private readonly totalsByCharts$ = combineLatest([
    this.chartsMonthSelection$,
    this.dashboardProfile$,
  ]).pipe(
    switchMap(([month, profile]) => {
      if (!profile) {
        return of({ income: 0, expenses: 0, balance: 0 });
      }
      
      // Use custom date range if provided, otherwise use month/year
      const totals$ = month.startDate && month.endDate
        ? this.dashboard.totalsForRange(new Date(month.startDate), new Date(month.endDate))
        : this.dashboard.totalsForMonth(month.month, month.year);
      
      return totals$.pipe(
        map((totals) => {
          const base = totals ?? { income: 0, expenses: 0, balance: 0 };
          const salaryDetails = Array.isArray(profile?.salary)
            ? profile.salary
            : [];
          const totalSalary = salaryDetails.reduce(
            (sum, item) => sum + (Number(item?.amount) || 0),
            0
          );

          if ((base.income ?? 0) === 0 && totalSalary > 0) {
            const income = totalSalary;
            const expenses = base.expenses ?? 0;
            return { income, expenses, balance: income - expenses };
          }
          return base;
        })
      );
    }),
    catchError(() => of({ income: 0, expenses: 0, balance: 0 })),
    shareReplay(1)
  );

  private readonly expenseByCategoryByMonth$ = combineLatest([
    this.chartsMonthSelection$,
    this.dashboardProfile$,
  ]).pipe(
    switchMap(([m, profile]) => {
      if (!profile) {
        return of([]);
      }
      // Use custom date range if provided
      if (m.startDate && m.endDate) {
        return this.dashboard.expenseByCategoryForRange(new Date(m.startDate), new Date(m.endDate));
      }
      return this.dashboard.expenseByCategoryForMonth(m.month, m.year);
    }),
    catchError(() => of([])),
    startWith([])
  );

  private readonly monthlyExpensesByMonth$ = combineLatest([
    this.chartsMonthSelection$,
    this.dashboardProfile$,
  ]).pipe(
    switchMap(([m, profile]) => {
      if (!profile) {
        return of([]);
      }
      // Use custom date range if provided
      if (m.startDate && m.endDate) {
        return this.dashboard.monthlyExpensesForRange(new Date(m.startDate), new Date(m.endDate));
      }
      return this.dashboard.monthlyExpensesForMonth(m.month, m.year);
    }),
    catchError(() => of([])),
    startWith([])
  );
  // Derive income vs expenses for Charts tab from totalsByCharts$
  private readonly incomeVsExpenseByMonth$ = combineLatest([
    this.totalsByCharts$,
    this.translateService.onLangChange.pipe(
      startWith({ lang: this.translateService.currentLang })
    ),
  ]).pipe(
    map(([t, langEvent]) => {
      return [
        {
          name: 'HOME.INCOME',
          value: t.income,
        },
        {
          name: 'HOME.EXPENSES',
          value: t.expenses,
        },
      ];
    })
  );

  readonly vm$ = combineLatest({
    loading: toObservable(this.state.loading),
    profile: this.dashboardProfile$.pipe(startWith(null)),
    totals: this.totalsByMonth$,
    incomeVsExpense: this.incomeVsExpenseByMonth$,
    expenseByCategory: this.expenseByCategoryByMonth$,
    monthlyExpenses: this.monthlyExpensesByMonth$,
  }).pipe(
    map((data) => {
      const salaryDetails = Array.isArray(data.profile?.salary)
        ? data.profile.salary
        : [];
      const totalSalary = salaryDetails.reduce(
        (sum, item) => sum + (Number(item?.amount) || 0),
        0
      );
      const salaryBreakdown = salaryDetails.map((item) => ({
        name: item.label,
        value: item.amount,
        percentage: totalSalary > 0 ? (item.amount || 0) / totalSalary : 0,
      }));

      return {
        ...data,
        salaryDetails,
        totalSalary,
        salaryBreakdown,
        currency: data.profile?.currency || 'USD',
      };
    }),
    shareReplay(1)
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
    // Active tab is now managed by the component state
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
    // Subscribe to vm$ for latest values (for injectors)
    this.vm$.pipe(takeUntil(this.destroy$)).subscribe((vm) => {
      this.latestVm = vm;
      this.createInjectors(vm);
      this.cdr.markForCheck();
    });
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
   * Refresh data when returning to the page
   */
  ionViewWillEnter(): void {
    this.refreshData();
  }

  /**
   * Handles month change from the month selector
   */
  onMonthChange(monthYear: MonthYear): void {
    this.selectedMonth = monthYear;
    // Notify Summary tab stream only
    this.summaryMonthSelection$.next(monthYear);
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
   * Handles date range change from the selector
   */
  onRangeChange(range: DateRange): void {
    // Save the selected range so it persists when switching tabs
    this.selectedRange = range;
    
    // Calculate date range based on selection
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1m':
        // Last 1 month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '6m':
        // Last 6 months
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        // Last 1 year
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
      default:
        // All time - use a very old date
        startDate = new Date(2020, 0, 1);
        break;
    }
    
    // Update the Charts tab selection to trigger data refresh
    // This will cause the charts to update with the new date range
    this.chartsMonthSelection$.next({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });
    
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
        catchError((error: any) => {
          this.handleError('COMMON.ERRORS.LOAD_DATA', error, true);
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

    // Trigger a subtle animation
    this.cardStates[cardName] = true;
    setTimeout(() => (this.cardStates[cardName] = false), 150);
  }

  // Retry handler from template: re-emit current month to refresh streams
  retry(): void {
    this.summaryMonthSelection$.next({ ...this.selectedMonth });
    // Also refresh charts with current selection
    const currentCharts = this.chartsMonthSelection$.getValue();
    this.chartsMonthSelection$.next({ ...currentCharts });
  }

  private isOpeningModal = false;

  // FAB: open expense form modal
  async openExpenseModal(expense?: Expense): Promise<void> {
    if (this.isOpeningModal) return;
    this.isOpeningModal = true;
    try {
      const modal = await this.modalCtrl.create({
        component: ExpenseFormComponent,
        componentProps: { expense, onClose: () => modal.dismiss() },
        backdropDismiss: false,
      });

      await modal.present();

      const result = await modal.onDidDismiss();
      if (result.role === 'confirm' || result.role === 'delete') {
        this.refreshData();
      }
    } catch (err: any) {
      this.handleError('COMMON.ERRORS.DEFAULT', err, true);
    } finally {
      this.isOpeningModal = false;
    }
  }

  // Refresh data method
  private refreshData(): void {
    // Trigger data refresh by re-emitting current month for Summary
    // Create new object to trigger change detection
    this.summaryMonthSelection$.next({ 
      month: this.selectedMonth.month,
      year: this.selectedMonth.year
    });
    // Also refresh charts with current selection
    const currentCharts = this.chartsMonthSelection$.getValue();
    this.chartsMonthSelection$.next({ ...currentCharts });

    // Also refresh transactions component if available
    if (this.transactionsComponent) {
      this.transactionsComponent.refreshTransactions();
    }

    this.cdr.markForCheck();
  }

  // Toggle language between Arabic and English
  toggleLanguage(): void {
    const newLang = this.currentLang === 'ar' ? 'en' : 'ar';
    this.translationService?.setLanguage(newLang);
    this.cdr.markForCheck();
  }
}
