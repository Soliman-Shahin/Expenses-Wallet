import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  finalize,
} from 'rxjs';
import { Router } from '@angular/router';
import { ExpenseService } from 'src/app/core/services/expense.service';
import { ProfileService } from 'src/app/modules/profile/services/profile.service';
import { Expense } from 'src/app/shared/models/expense.model';
import { Category } from 'src/app/shared/models/category.model';
import { BaseComponent } from 'src/app/shared/base/base.component';
import { ModalController } from '@ionic/angular';
import { ExpenseFormComponent } from 'src/app/home/components/expense-form/expense-form.component';
import { ComponentStateService } from 'src/app/shared/services/component-state.service';

interface TransactionItem {
  _id: string;
  original: Expense;
  title: string;
  amount: number;
  date: Date;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  type: 'income' | 'outcome';
  isIncome: boolean;
  formattedDate: string;
}

@Component({
  selector: 'app-transactions-list',
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ComponentStateService],
})
export class TransactionsListComponent extends BaseComponent implements OnInit {
  transactions: TransactionItem[] = [];
  categories: Category[] = [];
  error: string | null = null;
  userCurrency = 'USD';

  // Search and filters
  searchTerm = '';
  selectedCategory = '';
  selectedType = '';
  startDate: string | null = null;
  endDate: string | null = null;
  today = new Date().toISOString();

  // UI state
  showSearch = false;
  showFilters = false;
  showDatePicker = false;

  private searchSubject = new Subject<string>();

  constructor(
    private readonly profileService: ProfileService,
    private readonly modalController: ModalController
  ) {
    super();
    // Setup search debouncing
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.loadTransactions();
      });
  }

  override ngOnInit() {
    super.ngOnInit();
    this.loadInitialData();
  }

  async openAddTransactionModal() {
    const modal = await this.modalController.create({
      component: ExpenseFormComponent,
      cssClass: 'main-modal',
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.success) {
      this.loadTransactions(); // Refresh the list after adding a new transaction
    }
  }

  loadInitialData() {
    this.loadUserCurrency();
    this.loadCategories();
    this.loadTransactions();
  }

  loadUserCurrency() {
    const profile = this.profileService.getProfile();
    this.userCurrency = profile?.currency || 'USD';
  }

  loadCategories() {
    this.categoryService
      .getCategories({ skip: 0, limit: 100, sort: 'createdAt' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const arr = Array.isArray(response)
            ? response
            : (response as any)?.data?.data || (response as any)?.data || [];
          this.categories = arr;
        },
        error: (err: any) => {
          console.error('Error loading categories:', err);
        },
      });
  }

  loadTransactions() {
    this.setLoading(true);
    this.error = null;

    // Build query parameters for filtering
    const params: any = {};
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.selectedType) params.type = this.selectedType;
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;

    this.expenseService
      .getExpenses(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.setLoading(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          try {
            let rawExpenses: Expense[] = [];

            // Handle both old format (array) and new format (object with data)
            if (response?.data && Array.isArray(response.data)) {
              rawExpenses = response.data;
            } else {
              rawExpenses = Array.isArray(response)
                ? response
                : (response as any)?.data?.data ||
                  (response as any)?.data ||
                  [];
            }

            // Map to ViewModel
            const items = rawExpenses.map((e) => this.mapToViewModel(e));

            // Sort by date (newest first)
            this.transactions = items.sort((a, b) => {
              return b.date.getTime() - a.date.getTime();
            });
          } catch (err) {
            console.error('Error processing transactions:', err);
            this.setError('Failed to process data');
          }
        },
        error: (err: any) => {
          this.setError('Failed to load transactions');
          console.error('Error loading transactions:', err);
        },
      });
  }

  private mapToViewModel(e: Expense): TransactionItem {
    // Handle date normalization
    const dateVal = e.date || e.createdAt || new Date();
    let dateObj = new Date(dateVal);

    // Safety check for invalid dates
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date(); // Fallback to current date
    }

    // Handle Category
    // e.category can be string (ID) or object (populated)
    const cat = e.category;
    const isPopulated = cat && typeof cat !== 'string';

    // Fallbacks
    const categoryName = isPopulated ? (cat as Category).title : '—';
    const categoryColor = isPopulated
      ? (cat as Category).color || '#ccc'
      : '#ccc';

    // Icon logic
    let categoryIcon = 'pricetag-outline';
    let type: 'income' | 'outcome' = 'outcome';

    if (isPopulated) {
      const c = cat as Category;
      type = c.type;

      if (c.icon) {
        categoryIcon = c.icon;
      } else {
        if (c.type === 'income') categoryIcon = 'arrow-down-circle-outline';
        else if (c.type === 'outcome') categoryIcon = 'arrow-up-circle-outline';
      }
    }

    // Amount
    const amount = Number(e.amount) || 0;

    // Title/Description
    const title =
      e.description || (isPopulated ? (cat as Category).title : 'Transaction');

    return {
      _id: e._id,
      original: e,
      title,
      amount,
      date: dateObj,
      formattedDate: dateObj.toISOString(),
      categoryName,
      categoryIcon,
      categoryColor,
      type,
      isIncome: type === 'income',
    };
  }

  // Search and filter methods
  onSearchChange(event: any) {
    this.searchSubject.next(event.target.value);
  }

  onFilterChange() {
    this.loadTransactions();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.searchTerm = '';
      this.loadTransactions();
    }
  }

  // Date picker methods
  openDatePicker() {
    this.showDatePicker = true;
  }

  closeDatePicker() {
    this.showDatePicker = false;
  }

  applyDateFilter() {
    this.showDatePicker = false;
    this.loadTransactions();
  }

  clearDateFilter() {
    this.startDate = null;
    this.endDate = null;
  }

  get datePickerValue(): (string | null)[] | null {
    if (this.startDate || this.endDate) {
      return [this.startDate, this.endDate];
    }
    return null;
  }

  onDateChange(event: any) {
    const dates = event.detail.value;
    if (Array.isArray(dates)) {
      if (dates.length === 0) {
        this.startDate = null;
        this.endDate = null;
      } else {
        const sortedDates = dates.sort();
        this.startDate = sortedDates[0];
        this.endDate =
          sortedDates.length > 1
            ? sortedDates[sortedDates.length - 1]
            : sortedDates[0];
      }
    } else if (typeof dates === 'string') {
      this.startDate = dates;
      this.endDate = dates;
    }
  }

  getDateRangeText(): string {
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate).toLocaleDateString();
      const end = new Date(this.endDate).toLocaleDateString();
      return `${start} - ${end}`;
    } else if (this.startDate) {
      return `From ${new Date(this.startDate).toLocaleDateString()}`;
    } else if (this.endDate) {
      return `Until ${new Date(this.endDate).toLocaleDateString()}`;
    }
    return 'Date Range';
  }

  // Navigation
  addTransaction() {
    this.router.navigate(['/categories/create']);
  }

  onRefresh(event: any) {
    this.loadTransactions();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  trackById(_: number, item: TransactionItem) {
    return item._id;
  }

  onTransactionClick(item: TransactionItem) {
    this.onEdit(item.original);
  }

  async onEdit(item: Expense) {
    const modal = await this.modalController.create({
      component: ExpenseFormComponent,
      componentProps: {
        expense: item,
      },
      cssClass: 'main-modal',
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.success) {
      this.loadTransactions();
    }
  }

  async onDelete(item: Expense) {
    const transactionName = item.description || 'Transaction';
    const confirmed = await this.alertService.showDeleteConfirm(
      transactionName,
      async () => {
        this.expenseService.deleteExpense(item._id).subscribe({
          next: async () => {
            await this.toastService.presentSuccessToast(
              'bottom',
              'Transaction deleted successfully.'
            );
            this.loadTransactions(); // Refresh list
          },
          error: async (err) => {
            await this.toastService.presentErrorToast(
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
