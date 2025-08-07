import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/shared/base';
import { MonthYear, SalaryDetail } from '../../models';
import { User } from 'src/app/modules/auth/models';
import { catchError, finalize, of, takeUntil, tap } from 'rxjs';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';

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
  currency: string = 'EGP';

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

  constructor() {
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

          // Mock salary data until a real service is available
          this.totalSalary = 5000.0;
          this.salaryDetails = [
            { label: 'Basic Salary', amount: 4500.0 },
            { label: 'Bonus', amount: 500.0 },
          ];
        },
        error: (err: any) => {
          console.error('Failed to load dashboard data', err);
          this.setError('Failed to load dashboard data. Please try again.');
        },
      });
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
