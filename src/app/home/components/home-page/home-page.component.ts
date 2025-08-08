import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/shared/base';
import { MonthYear, SalaryDetail } from '../../models';
import { User } from 'src/app/modules/auth/models';
import { catchError, finalize, of, takeUntil, tap } from 'rxjs';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { ChartDataService } from 'src/app/shared/services/chart-data.service';
import { BarChartComponent } from 'src/app/shared/components/charts';
import { PieChartComponent } from 'src/app/shared/components/charts';
import { LineChartComponent } from 'src/app/shared/components/charts';
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

  // Chart data
  incomeVsExpenseData: any[] = [];
  expenseByCategoryData: any[] = [];
  monthlyExpensesData: any[] = [];
  salaryBreakdownData: any[] = [];

  // Month totals for the scroll header
  monthTotals: { [key: string]: number } = {};

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

  get displayUsername(): string {
    return this.user?.['username'] || 'User';
  }

  /**
   * Initializes the component with additional setup
   */
  override ngOnInit(): void {
    super.ngOnInit();
    this.setupRouteDataSubscription();
    this.loadDashboardData();
    this.loadMonthTotals();

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
    this.loadMonthTotals();
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
   * Loads the totals for each month to display in the scroll header
   */
  private loadMonthTotals(): void {
    const currentYear = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // In a real app, you would fetch this data from your API
    // This is a mock implementation
    months.forEach((month) => {
      const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
      // Mock data - replace with actual API call
      this.monthTotals[monthKey] = this.getRandomAmount(-500, 5000);
    });

    this.cdr.markForCheck();
  }

  /**
   * Helper to generate random amounts for demo purposes
   */
  private getRandomAmount(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Handles content scroll events
   */
  onContentScroll(event: any): void {
    // Can be used for scroll-based effects if needed
    console.log('scroll event', event);
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
    this.setLoading(true);
    this.cdr.markForCheck();

    const { year, month } = this.selectedMonth;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    this.expenseService
      .getTotals(startDate, endDate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.setLoading(false);
        })
      )
      .subscribe({
        next: ({ income, expenses }: { income: number; expenses: number }) => {
          this.income = income;
          this.expenses = expenses;
          this.balance = income - expenses;

          // Salary and currency are sourced from user profile via ProfileService
          // salaryDetails stays in sync from the profile subscription

          // Load chart data
          this.loadChartData();
        },
        error: (err: any) => {
          console.error('Failed to load dashboard data', err);
          this.setError('Failed to load dashboard data. Please try again.');
        },
      });
  }

  private loadChartData(): void {
    // Load income vs expense data
    this.chartDataService.getIncomeVsExpense().subscribe((data) => {
      this.incomeVsExpenseData = data;
      this.cdr.markForCheck();
    });

    // Load expense by category data
    this.chartDataService.getExpenseByCategory().subscribe((data) => {
      this.expenseByCategoryData = data;
      this.cdr.markForCheck();
    });

    // Load monthly expenses data
    this.chartDataService.getMonthlyExpenses().subscribe((data) => {
      this.monthlyExpensesData = data;
      this.cdr.markForCheck();
    });

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
    modal?.present();
  }

  /**
   * Loads transactions for the selected month and year
   */
  private loadTransactionsForMonth(month: number, year: number): void {
    this.setLoading(true);
    this.cdr.markForCheck();

    // Example implementation (uncomment and implement as needed):
    /*
    this.transactionService.getForMonth(month, year).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.setLoading(false);
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (transactions) => {
        // Handle successful transaction load
      },
      error: (error) => {
        this.error = 'Failed to load transactions. Please try again.';
        this.toastService.presentErrorToast('bottom', 'TRANSACTIONS.ERRORS.LOAD_FAILED');
      }
    });
    */
  }
}
