import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';
import { ExpenseService } from 'src/app/core/services/expense.service';
import { ProfileService } from 'src/app/modules/profile/services/profile.service';
import { CategoryService } from 'src/app/modules/categories/services/categories.service';
import { Expense } from 'src/app/shared/models/expense.model';
import { BaseComponent } from 'src/app/shared/base/base.component';

@Component({
  selector: 'app-transactions-list',
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.scss'],
})
export class TransactionsListComponent extends BaseComponent implements OnInit {
  transactions: Expense[] = [];
  categories: any[] = [];
  error: string | null = null;
  userCurrency = 'USD';

  // Search and filters
  searchTerm = '';
  selectedCategory = '';
  selectedType = '';
  startDate: string | undefined = undefined;
  endDate: string | undefined = undefined;
  today = new Date().toISOString();

  // UI state
  showSearch = false;
  showFilters = false;
  showDatePicker = false;

  private searchSubject = new Subject<string>();

  constructor(
    private profileService: ProfileService,
    protected override categoryService: CategoryService,
    protected override expenseService: ExpenseService,
    protected override router: Router
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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Handle both old format (array) and new format (object with data)
          if (response?.data && Array.isArray(response.data)) {
            this.transactions = response.data;
          } else {
            const arr: Expense[] = Array.isArray(response)
              ? response
              : (response as any)?.data?.data || (response as any)?.data || [];

            // Sort by date (newest first) - only if backend doesn't handle it
            this.transactions = arr.sort((a, b) => {
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

              return db - da; // Newest first
            });
          }

          this.setLoading(false);
        },
        error: (err: any) => {
          this.setError('Failed to load transactions');
          this.setLoading(false);
          console.error('Error loading transactions:', err);
        },
      });
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
    this.startDate = undefined;
    this.endDate = undefined;
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
    return 'Date Range';
  }

  // Navigation
  addTransaction() {
    // Navigate to categories create page to add new expense
    this.router.navigate(['/categories/create']);
  }

  onRefresh(event: any) {
    this.loadTransactions();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  trackById(_: number, item: Expense) {
    return (item as any)?._id || (item as any)?.id || item;
  }

  // Template helpers
  getTitle(t: Expense): string {
    return (t as any)?.title || (t as any)?.name || '—';
  }

  getOperationName(t: Expense): string {
    return (
      (t as any)?.description || (t as any)?.title || (t as any)?.name || '—'
    );
  }

  getCategoryName(t: Expense): string {
    const cat = (t as any)?.category;
    if (!cat) return '—';
    if (typeof cat === 'string') {
      return '—';
    }
    return (cat as any)?.name || '—';
  }

  getCategoryIcon(t: Expense): string {
    const cat = (t as any)?.category;
    const icon = (cat as any)?.icon || (cat as any)?.iconName;
    if (icon && typeof icon === 'string') return icon;
    const type = (cat as any)?.type as 'income' | 'expense' | undefined;
    if (type === 'income') return 'arrow-down-circle-outline';
    if (type === 'expense') return 'arrow-up-circle-outline';
    return 'pricetag-outline';
  }

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

  getCategoryType(t: Expense): 'income' | 'expense' {
    const cat = (t as any)?.category;
    const type = (cat as any)?.type;
    return type === 'income' ? 'income' : 'expense';
  }
}
