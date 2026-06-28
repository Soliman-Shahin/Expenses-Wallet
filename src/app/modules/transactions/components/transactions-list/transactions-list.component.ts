import { Component, ChangeDetectionStrategy, OnInit, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  finalize,
  takeUntil,
} from 'rxjs';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/modules/profile/services/profile.service';
import { Expense } from 'src/app/shared/models/expense.model';
import { Category } from 'src/app/shared/models/category.model';
import { BaseComponent } from 'src/app/shared/base/base.component';
import { ModalController, IonicModule } from '@ionic/angular';
import { ExpenseFormComponent } from 'src/app/home/components/expense-form/expense-form.component';
import { ComponentStateService } from 'src/app/shared/services/component-state.service';
import { FormsModule } from '@angular/forms';
import { SkeletonBlockComponent } from '../../../../shared/ui/skeleton-block/skeleton-block.component';
import { NgClass, LowerCasePipe, CurrencyPipe, DatePipe } from '@angular/common';
import { AddFabButtonComponent } from '../../../../shared/ui/add-fab-button/add-fab-button.component';
import { TranslateModule } from '@ngx-translate/core';

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
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    SkeletonBlockComponent,
    NgClass,
    AddFabButtonComponent,
    LowerCasePipe,
    CurrencyPipe,
    DatePipe,
    TranslateModule,
  ],
})
export class TransactionsListComponent extends BaseComponent implements OnInit {
  // Signals for state management
  rawTransactions = signal<Expense[]>([]);
  transactions = computed(() => {
    const raw = this.rawTransactions();
    const items = raw.map((e) => this.mapToViewModel(e));
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  });
  categories = signal<Category[]>([]);
  userCurrency = signal<string>('USD');

  // Filters signals
  searchTerm = signal<string>('');
  selectedCategories = signal<string[]>([]);
  selectedType = signal<string>('');
  startDate = signal<string | null>(null);
  endDate = signal<string | null>(null);

  // UI state signals
  showSearch = signal<boolean>(false);
  showFilters = signal<boolean>(false);
  showDatePicker = signal<boolean>(false);
  showCategoryPopover = signal<boolean>(false);

  tempStartDate: string | null = null;
  tempEndDate: string | null = null;
  categoryPopoverEvent: any = null;

  private searchSubject = new Subject<string>();
  private isOpeningModal = false;
  private isProcessingAction = false;

  currentCalendarDate: Date = new Date();
  calendarWeeks: Date[][] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private readonly profileService: ProfileService,
    private readonly modalController: ModalController
  ) {
    super();
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.loadTransactions();
      });
  }

  override ngOnInit() {
    super.ngOnInit();
    this.loadUserCurrency();

    this.loadCategories();
    this.loadTransactions();
  }

  private hasEntered = false;

  ionViewWillEnter() {
    if (this.hasEntered) {
      this.loadTransactions();
    }
    this.hasEntered = true;
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
        this.loadTransactions();
      }
    } finally {
      this.isOpeningModal = false;
    }
  }

  loadUserCurrency() {
    const profile = this.profileService.getProfile();
    this.userCurrency.set(profile?.currency || 'USD');
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
          this.categories.set(arr);
        },
        error: (err: any) => console.error('Error loading categories:', err),
      });
  }

  loadTransactions() {
    this.setLoading(true);
    this.setError(null);

    const params: any = {};
    if (this.searchTerm()) params.search = this.searchTerm();
    
    const selectedCats = this.selectedCategories();
    if (selectedCats.length === 1) {
      params.category = selectedCats[0];
    } else if (selectedCats.length > 1) {
      params.categories = selectedCats.join(',');
    }

    if (this.selectedType()) params.type = this.selectedType();
    
    if (this.startDate()) params.startDate = this.startDate();
    else {
      const now = new Date();
      params.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    
    if (this.endDate()) params.endDate = this.endDate();
    else {
      const now = new Date();
      params.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    }

    this.expenseService
      .getExpenses(params, true)
      .pipe(
        finalize(() => {
          this.setLoading(false);
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          try {
            let rawExpenses: Expense[] = [];
            if (response?.data && Array.isArray(response.data)) {
              rawExpenses = response.data;
            } else {
              rawExpenses = Array.isArray(response)
                ? response
                : (response as any)?.data?.data || (response as any)?.data || [];
            }
            this.rawTransactions.set(rawExpenses);
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
    const dateVal = e.date || e.createdAt || new Date();
    let dateObj = new Date(dateVal);
    if (isNaN(dateObj.getTime())) dateObj = new Date();

    let cat = e.category;
    
    // Extract ID if it's an object (can happen during offline sync or API variations)
    const catId = typeof cat === 'object' && cat ? ((cat as any)._id || (cat as any).id) : cat;
    
    // Try to find it in our loaded categories list using the ID
    if (typeof catId === 'string') {
      const foundCat = this.categories().find(c => c._id === catId);
      if (foundCat) {
        cat = foundCat;
      }
    }

    const isPopulated = cat && typeof cat !== 'string';
    const categoryName = isPopulated ? (cat as Category).title : '—';
    const categoryColor = isPopulated ? (cat as Category).color || '#ccc' : '#ccc';

    let categoryIcon = 'pricetag-outline';
    let type: 'income' | 'outcome' = 'outcome';

    if (isPopulated) {
      const c = cat as Category;
      type = c.type;
      if (c.icon) categoryIcon = c.icon;
      else {
        if (c.type === 'income') categoryIcon = 'arrow-down-circle-outline';
        else if (c.type === 'outcome') categoryIcon = 'arrow-up-circle-outline';
      }
    }

    const amount = Number(e.amount) || 0;
    const title = e.description || (isPopulated ? (cat as Category).title : 'Transaction');

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

  onSearchChange(event: any) {
    this.searchSubject.next(event.target.value);
  }

  onFilterChange(event?: any) {
    if (event?.target) {
      this.selectedType.set(event.target.value || '');
    }
    this.loadTransactions();
  }

  openCategoryPopover(event: Event) {
    this.categoryPopoverEvent = event;
    this.showCategoryPopover.set(true);
  }

  closeCategoryPopover() {
    this.showCategoryPopover.set(false);
    this.categoryPopoverEvent = null;
  }

  toggleCategory(catId: string) {
    const current = this.selectedCategories();
    if (catId === '') {
      this.selectedCategories.set([]);
    } else {
      const idx = current.indexOf(catId);
      if (idx === -1) {
        this.selectedCategories.set([...current, catId]);
      } else {
        this.selectedCategories.set(current.filter(id => id !== catId));
      }
    }
    this.loadTransactions();
  }

  isCategorySelected(catId: string): boolean {
    const current = this.selectedCategories();
    if (catId === '') return current.length === 0;
    return current.includes(catId);
  }

  getSelectedCategoryText(): string {
    const current = this.selectedCategories();
    if (current.length === 0) return this.translateService.instant('TRANSACTIONS.ALL_CATEGORIES');
    if (current.length === 1) {
      const cat = this.categories().find(c => c._id === current[0]);
      return cat?.title || this.translateService.instant('TRANSACTIONS.CATEGORY');
    }
    return `${current.length} ${this.translateService.instant('COMMON.SELECTED')}`;
  }

  getSelectedCategoryIcon(): string {
    const current = this.selectedCategories();
    if (current.length === 1) {
      const cat = this.categories().find(c => c._id === current[0]);
      return cat?.icon || 'pricetag-outline';
    }
    return 'pricetag-outline';
  }

  getSelectedCategoryColor(): string | null {
    const current = this.selectedCategories();
    if (current.length === 1) {
      const cat = this.categories().find(c => c._id === current[0]);
      return cat?.color || null;
    }
    return null;
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  toggleSearch() {
    this.showSearch.set(!this.showSearch());
    if (!this.showSearch()) {
      this.searchTerm.set('');
      this.loadTransactions();
    }
  }

  generateCalendar(baseDate: Date) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const endDate = new Date(lastDayOfMonth);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
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
    if (this.tempStartDate && this.tempEndDate) {
      this.tempStartDate = date.toISOString();
      this.tempEndDate = null;
      return;
    }
    if (this.tempStartDate && !this.tempEndDate) {
      const start = new Date(this.tempStartDate);
      if (date < start) {
        this.tempStartDate = date.toISOString();
      } else {
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        this.tempEndDate = end.toISOString();
      }
      return;
    }
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

  openDatePicker() {
    this.tempStartDate = this.startDate();
    this.tempEndDate = this.endDate();
    
    if (this.tempStartDate) {
      this.currentCalendarDate = new Date(this.tempStartDate);
    } else {
      this.currentCalendarDate = new Date();
    }
    this.generateCalendar(this.currentCalendarDate);
    this.showDatePicker.set(true);
  }

  closeDatePicker() {
    this.showDatePicker.set(false);
  }

  applyDateFilter() {
    this.startDate.set(this.tempStartDate);
    this.endDate.set(this.tempEndDate);
    this.showDatePicker.set(false);
    this.loadTransactions();
  }

  clearDateFilter() {
    this.startDate.set(null);
    this.endDate.set(null);
    this.tempStartDate = null;
    this.tempEndDate = null;
    this.showDatePicker.set(false);
    this.loadTransactions();
  }

  getDateRangeText(): string {
    const sDate = this.startDate();
    const eDate = this.endDate();
    if (sDate && eDate) {
      return `${new Date(sDate).toLocaleDateString()} ${this.translateService.instant('TRANSACTIONS.TO')} ${new Date(eDate).toLocaleDateString()}`;
    } else if (sDate) {
      return `${this.translateService.instant('TRANSACTIONS.FROM')} ${new Date(sDate).toLocaleDateString()}`;
    } else if (eDate) {
      return `${this.translateService.instant('TRANSACTIONS.UNTIL')} ${new Date(eDate).toLocaleDateString()}`;
    }
    return this.translateService.instant('TRANSACTIONS.CURRENT_MONTH');
  }

  addTransaction() {
    this.router.navigate(['/categories/create']);
  }

  onRefresh(event: any) {
    this.loadTransactions();
    setTimeout(() => event.target.complete(), 1000);
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
        componentProps: { expense: item },
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
      await this.alertService.showDeleteConfirm(
        transactionName,
        async () => {
          this.expenseService.deleteExpense(item._id).subscribe({
            next: async () => {
              await this.toastService.presentSuccessToast(
                'bottom',
                this.translateService.instant('EXPENSE.DELETE_SUCCESS_TOAST')
              );
              this.loadTransactions();
            },
            error: async (err) => {
              await this.toastService.presentErrorToast(
                'bottom',
                this.translateService.instant('EXPENSE.DELETE_ERROR_TOAST')
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
