import { Component, OnInit, inject } from '@angular/core';
import { BaseComponent } from 'src/app/shared/base';
import { MonthYear, SalaryDetail } from '../../models';
import { User } from 'src/app/modules/auth/models';
import { catchError, finalize, of, takeUntil, tap, forkJoin } from 'rxjs';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { ChartDataService } from 'src/app/shared/services/chart-data.service';
import { ProfileService } from 'src/app/modules/profile/services/profile.service';

// Constants
const MAX_RETRY_ATTEMPTS = 3;

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent extends BaseComponent implements OnInit {
  selectedMonth: MonthYear = this.getCurrentMonthYear();
  currentDate: Date = new Date();
  balance: number | null = null;
  income: number | null = null;
  expenses: number | null = null;
  percentageChange: number | null = null;
  totalSalary: number | null = null;
  salaryDetails: SalaryDetail[] = [];
  currency: string = 'USD';

  // UI state
  activeTab: 'charts' | 'summary' = 'summary';
  // Local loading flags to avoid flipping the whole page
  isDashboardLoading = false;
  isTransactionsLoading = false;
  // Use global loading only for the initial load to unblock the page content
  private _useGlobalLoadingOnce = true;
  // Track if dashboard loaded successfully at least once
  private _hasLoadedOnce = false;

  // Chart data
  incomeVsExpenseData: any[] = [];
  expenseByCategoryData: any[] = [];
  monthlyExpensesData: any[] = [];
  salaryBreakdownData: any[] = [];

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

  constructor(
    private chartDataService: ChartDataService,
    private profileService: ProfileService
  ) {
    super();
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
    this.loadDashboardData();

    // Initialize from existing profile cache for immediate UX
    const existingProfile = this.profileService.getProfile();
    if (existingProfile) {
      if (existingProfile.currency) this.currency = existingProfile.currency;
      if (Array.isArray(existingProfile.salary)) {
        this.salaryDetails = existingProfile.salary;
        this.totalSalary = existingProfile.salary.reduce(
          (sum, s) => sum + (s?.amount ?? 0),
          0
        );
      }
    }

    // Sync currency and salary from Profile
    this.profileService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        if (profile) {
          if (profile.currency) this.currency = profile.currency;
          if (Array.isArray(profile.salary)) {
            this.salaryDetails = profile.salary;
            this.totalSalary = profile.salary.reduce(
              (sum, s) => sum + (s?.amount ?? 0),
              0
            );
          }
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Retries fetching the user data.
   */
  retry(): void {
    this.setError(null);
    this.setLoading(true);
    this.subscribeToUserChanges();
  }

  /**
   * Handles month change from the month selector
   */
  onMonthChange(monthYear: MonthYear): void {
    this.selectedMonth = monthYear;
    this.loadDashboardData();
    this.loadTransactionsForMonth(monthYear.month, monthYear.year);
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
    // If user just became available after login and we haven't loaded yet, load dashboard now
    if (user && !this._hasLoadedOnce) {
      this.loadDashboardData();
    }
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
   * Updates the header configuration
   */
  private updateHeaderConfig(): void {
    this.headerService.updateButtonConfig(this.headerConfig);
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
          this.updateHeaderConfig();
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

  private loadDashboardData(): void {
    if (this._useGlobalLoadingOnce) {
      this.setLoading(true);
    } else {
      this.isDashboardLoading = true;
    }
    this.cdr.markForCheck();

    const { year, month } = this.selectedMonth;
    // Start of first day (local)
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    // End of last day (local) - inclusive
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    this.expenseService
      .getTotals(startDate, endDate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (this._useGlobalLoadingOnce) {
            this.setLoading(false);
            this._useGlobalLoadingOnce = false;
          } else {
            this.isDashboardLoading = false;
          }
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ({ income, expenses }: { income: number; expenses: number }) => {
          this.income = income;
          this.expenses = expenses;
          this.balance = income - expenses;
          this._hasLoadedOnce = true;

          // Salary and currency are sourced from user profile via ProfileService
          // salaryDetails stays in sync from the profile subscription

          // Load chart data
          this.loadChartData();
        },
        error: (err: any) => {
          console.error('Failed to load dashboard data', err);
          this.setError('Failed to load dashboard data. Please try again.');
          // Still attempt to load chart data so the dashboard remains useful
          this.loadChartData();
        },
      });
  }

  private loadChartData(): void {
    // Load income vs expense data (use real totals)
    if (this.income != null && this.expenses != null) {
      this.incomeVsExpenseData = [
        { name: 'Income', value: this.income },
        { name: 'Expenses', value: this.expenses },
      ];
      this.cdr.markForCheck();
    } else {
      const { year, month } = this.selectedMonth;
      const startDate = new Date(year, month - 1, 1);
      // Inclusive end-of-month for totals endpoint
      const endDate = new Date(year, month, 0);
      this.expenseService
        .getTotals(startDate, endDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe(({ income, expenses }) => {
          this.income = income;
          this.expenses = expenses;
          this.balance = income - expenses;
          this.incomeVsExpenseData = [
            { name: 'Income', value: income },
            { name: 'Expenses', value: expenses },
          ];
          this.cdr.markForCheck();
        });
    }

    // Load expense by category data (real aggregation for selected month)
    const { year, month } = this.selectedMonth;
    const startDate = new Date(year, month - 1, 1);
    // End-exclusive: first day of next month to include entire current month
    const endExclusive = new Date(year, month, 1);

    forkJoin({
      categoriesResp: this.categoryService.getCategories({
        skip: 0,
        limit: 1000,
        sort: 'name',
      }),
      expenses: this.expenseService.getExpenses(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ categoriesResp, expenses }: any) => {
        // Normalize categories response to an array
        const catResp: any = categoriesResp;
        const categories: any[] = Array.isArray(catResp)
          ? catResp
          : catResp?.data?.data || catResp?.data || [];
        const byId = new Map<string, { name: string; type?: string }>();
        categories.forEach((c: any) =>
          byId.set(c._id, { name: c?.title || c?.name, type: c?.type })
        );

        // Normalize expenses response to an array
        const expResp: any = expenses;
        const expensesArr: any[] = Array.isArray(expResp)
          ? expResp
          : expResp?.data?.data || expResp?.data || [];

        const start = startDate.getTime();
        const end = endExclusive.getTime();
        const sums = new Map<string, number>();
        let incomeSum = 0;
        let expenseSum = 0;

        expensesArr
          .filter((e: any) => {
            const rawDate = e?.date || e?.createdAt;
            if (!rawDate) return false;
            const d = new Date(rawDate).getTime();
            // include expenses on the last day by using end-exclusive bound (d < end)
            return d >= start && d < end;
          })
          .forEach((e: any) => {
            let name = 'Uncategorized';
            let catType: string | undefined;
            if (e.category && typeof e.category === 'object') {
              name = e.category.title || e.category.name || name;
              catType = e.category.type;
            } else if (typeof e.category === 'string') {
              const meta = byId.get(e.category);
              if (meta) {
                name = meta.name;
                catType = meta.type;
              }
            }
            const amt = Number(e.amount);
            if (!Number.isFinite(amt) || Number.isNaN(amt)) return;
            const prev = sums.get(name) || 0;
            sums.set(name, prev + amt);

            // Compute totals for bar chart using category type when available
            if (catType === 'income') {
              incomeSum += amt;
            } else {
              // default to expenses when unknown or explicitly expense
              expenseSum += amt;
            }
          });

        // Prefer user's salary as income if available; fallback to computed incomeSum
        const effectiveIncome =
          this.totalSalary != null ? this.totalSalary : incomeSum;

        // Update income vs expenses chart from effective income and computed expenses
        this.incomeVsExpenseData = [
          { name: 'Income', value: effectiveIncome },
          { name: 'Expenses', value: expenseSum },
        ];
        this.income = effectiveIncome;
        this.expenses = expenseSum;
        this.balance = effectiveIncome - expenseSum;

        this.expenseByCategoryData = Array.from(sums.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        // Build real Monthly Expenses (daily) line chart data for selected month
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyTotals = new Array<number>(daysInMonth).fill(0);
        expensesArr
          .filter((e: any) => {
            const rawDate = e?.date || e?.createdAt;
            if (!rawDate) return false;
            const d = new Date(rawDate);
            const t = d.getTime();
            return t >= start && t < end; // same end-exclusive window
          })
          .forEach((e: any) => {
            // classify by type to exclude income from daily expenses
            let catType: string | undefined;
            if (e.category && typeof e.category === 'object') {
              catType = e.category.type;
            } else if (typeof e.category === 'string') {
              const meta = byId.get(e.category);
              if (meta) catType = meta.type;
            }
            if (catType === 'income') return; // skip incomes

            const amt = Number(e.amount);
            if (!Number.isFinite(amt) || Number.isNaN(amt)) return;
            const d = new Date(e?.date || e?.createdAt);
            const dayIndex = d.getDate() - 1; // 0-based
            if (dayIndex >= 0 && dayIndex < daysInMonth) {
              dailyTotals[dayIndex] += amt;
            }
          });

        this.monthlyExpensesData = dailyTotals.map((v, i) => ({
          name: String(i + 1),
          value: v,
        }));

        this.cdr.markForCheck();
      });

    // Monthly expenses data now computed from real transactions above

    // Load salary breakdown data
    this.chartDataService.getSalaryBreakdown().subscribe((data) => {
      this.salaryBreakdownData = data;
      this.cdr.markForCheck();
    });
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
    this.cardStates[cardName] = false;
    setTimeout(() => {
      this.cardStates[cardName] = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.cardStates[cardName] = false;
        this.cdr.markForCheck();
      }, 150);
    }, 10);
  }

  async openExpenseModal() {
    const modal = await this.modalCtrl?.create({
      component: ExpenseFormComponent,
    });
    await modal?.present();

    const result = await modal?.onDidDismiss();
    if (result && result.role === 'confirm') {
      // Refresh dashboard totals and charts after a successful add/update
      this.loadDashboardData();
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
