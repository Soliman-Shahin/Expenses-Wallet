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
  selectedCategories: string[] = []; // Multi-select: array of selected category IDs
  selectedType = '';
  startDate: string | null = null;
  endDate: string | null = null;
  tempStartDate: string | null = null;
  tempEndDate: string | null = null;
  today = new Date().toISOString();

  // UI state
  showSearch = false;
  showFilters = false;
  showDatePicker = false;
  showCategoryPopover = false;
  categoryPopoverEvent: any = null;

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
    if (this.isOpeningModal) return;
    this.isOpeningModal = true;
    try {
      const modal = await this.modalController.create({
        component: ExpenseFormComponent,
        cssClass: 'main-modal',
      });
      await modal.present();

      const { role } = await modal.onDidDismiss();
      if (role === 'confirm' || role === 'delete') {
        this.loadTransactions(); // Refresh the list after adding/deleting a new transaction
      }
    } finally {
      this.isOpeningModal = false;
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
    // Send selected categories as comma-separated string (or single value if only one)
    if (this.selectedCategories.length === 1) {
      params.category = this.selectedCategories[0];
    } else if (this.selectedCategories.length > 1) {
      params.categories = this.selectedCategories.join(',');
    }
    if (this.selectedType) params.type = this.selectedType;
    if (this.startDate) params.startDate = this.startDate;
    else {
      const now = new Date();
      params.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    
    if (this.endDate) params.endDate = this.endDate;
    else {
      const now = new Date();
      params.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    }

    this.expenseService
      .getExpenses(params, true) // forceRefresh = true to bypass cache
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

  // ── Category Popover (Multi-Select) ─────────────────────────────

  openCategoryPopover(event: Event) {
    this.categoryPopoverEvent = event;
    this.showCategoryPopover = true;
  }

  closeCategoryPopover() {
    this.showCategoryPopover = false;
    this.categoryPopoverEvent = null;
  }

  toggleCategory(catId: string) {
    if (catId === '') {
      // "All" clears all selections
      this.selectedCategories = [];
    } else {
      const idx = this.selectedCategories.indexOf(catId);
      if (idx === -1) {
        this.selectedCategories = [...this.selectedCategories, catId];
      } else {
        this.selectedCategories = this.selectedCategories.filter(id => id !== catId);
      }
    }
    this.loadTransactions();
    this.cdr.markForCheck();
  }

  isCategorySelected(catId: string): boolean {
    if (catId === '') return this.selectedCategories.length === 0;
    return this.selectedCategories.includes(catId);
  }

  getSelectedCategoryText(): string {
    if (this.selectedCategories.length === 0) {
      return 'All Categories';
    }
    if (this.selectedCategories.length === 1) {
      const cat = this.categories.find(c => c._id === this.selectedCategories[0]);
      return cat?.title || 'Category';
    }
    return `${this.selectedCategories.length} selected`;
  }

  getSelectedCategoryIcon(): string {
    if (this.selectedCategories.length === 1) {
      const cat = this.categories.find(c => c._id === this.selectedCategories[0]);
      return cat?.icon || 'pricetag-outline';
    }
    return 'pricetag-outline';
  }

  getSelectedCategoryColor(): string | null {
    if (this.selectedCategories.length === 1) {
      const cat = this.categories.find(c => c._id === this.selectedCategories[0]);
      return cat?.color || null;
    }
    return null;
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

  // --- Custom Date Range Picker ---
  currentCalendarDate: Date = new Date();
  
  private isOpeningModal = false;
  private isProcessingAction = false;
  calendarWeeks: Date[][] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  generateCalendar(baseDate: Date) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Go back to Sunday
    
    const endDate = new Date(lastDayOfMonth);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // Go forward to Saturday
    }

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      currentWeek.push(new Date(currentDate));
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    this.calendarWeeks = weeks;
  }

  prevMonth() {
    this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() - 1, 1);
    this.generateCalendar(this.currentCalendarDate);
  }

  nextMonth() {
    this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() + 1, 1);
    this.generateCalendar(this.currentCalendarDate);
  }

  selectDate(date: Date) {
    // If both start and end are selected, reset and start over
    if (this.tempStartDate && this.tempEndDate) {
      this.tempStartDate = date.toISOString();
      this.tempEndDate = null;
      return;
    }
    // If only start is selected
    if (this.tempStartDate && !this.tempEndDate) {
      const start = new Date(this.tempStartDate);
      if (date < start) {
        // If selected date is before start date, it becomes the new start date
        this.tempStartDate = date.toISOString();
      } else {
        // Selected date is after start date, so it's the end date
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        this.tempEndDate = end.toISOString();
      }
      return;
    }
    // If nothing is selected
    this.tempStartDate = date.toISOString();
  }

  isDateSelectedStart(date: Date): boolean {
    if (!this.tempStartDate) return false;
    const start = new Date(this.tempStartDate);
    return date.getFullYear() === start.getFullYear() && date.getMonth() === start.getMonth() && date.getDate() === start.getDate();
  }

  isDateSelectedEnd(date: Date): boolean {
    if (!this.tempEndDate) return false;
    const end = new Date(this.tempEndDate);
    return date.getFullYear() === end.getFullYear() && date.getMonth() === end.getMonth() && date.getDate() === end.getDate();
  }

  isDateInRange(date: Date): boolean {
    if (!this.tempStartDate || !this.tempEndDate) return false;
    const start = new Date(this.tempStartDate);
    start.setHours(0,0,0,0);
    const end = new Date(this.tempEndDate);
    end.setHours(23,59,59,999);
    return date > start && date < end;
  }
  
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  }

  isCurrentMonthDay(date: Date): boolean {
    return date.getMonth() === this.currentCalendarDate.getMonth();
  }

  // Date picker methods
  openDatePicker() {
    this.tempStartDate = this.startDate;
    this.tempEndDate = this.endDate;
    
    // Default calendar view to tempStartDate if available, otherwise current month
    if (this.tempStartDate) {
      this.currentCalendarDate = new Date(this.tempStartDate);
    } else {
      this.currentCalendarDate = new Date();
    }
    this.generateCalendar(this.currentCalendarDate);
    
    this.showDatePicker = true;
  }

  closeDatePicker() {
    this.showDatePicker = false;
  }

  applyDateFilter() {
    this.startDate = this.tempStartDate;
    this.endDate = this.tempEndDate;
    this.showDatePicker = false;
    this.loadTransactions();
  }

  clearDateFilter() {
    this.startDate = null;
    this.endDate = null;
    this.tempStartDate = null;
    this.tempEndDate = null;
    this.showDatePicker = false;
    this.loadTransactions();
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
    return 'Current Month';
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
    if (this.isOpeningModal) return;
    this.isOpeningModal = true;
    try {
      const modal = await this.modalController.create({
        component: ExpenseFormComponent,
        componentProps: {
          expense: item,
        },
        cssClass: 'main-modal',
      });
      await modal.present();

      const { role } = await modal.onDidDismiss();
      if (role === 'confirm' || role === 'delete') {
        this.loadTransactions();
      }
    } finally {
      this.isOpeningModal = false;
    }
  }

  async onDelete(item: Expense) {
    if (this.isProcessingAction) return;
    this.isProcessingAction = true;
    try {
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
    } finally {
      this.isProcessingAction = false;
    }
  }
}
