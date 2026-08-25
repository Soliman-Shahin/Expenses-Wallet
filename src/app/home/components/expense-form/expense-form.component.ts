import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith, finalize, takeUntil, tap } from 'rxjs/operators';

import { BaseComponent } from 'src/app/shared/base/base.component';
import { Expense, Category } from 'src/app/shared/models';
import { ProfileService } from 'src/app/modules/profile/services/profile.service';
import { trapFocus, releaseFocus } from 'src/app/shared/utils/focus-trap';
import { IonicModule } from '@ionic/angular';
import { NgClass, AsyncPipe, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-expense-form',
    templateUrl: './expense-form.component.html',
    styleUrls: ['./expense-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        IonicModule,
        FormsModule,
        ReactiveFormsModule,
        NgClass,
        AsyncPipe,
        DatePipe,
        TranslateModule,
    ],
})
export class ExpenseFormComponent
  extends BaseComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() expense?: Expense;
  @Input() onClose: () => void = () => {};

  @ViewChild('formContainer', { read: ElementRef })
  formContainerRef!: ElementRef<HTMLElement>;

  expenseForm!: FormGroup;
  isEditMode = false;
  maxDate = new Date().toISOString();
  userCurrency = 'USD';

  allCategories: Category[] = [];
  filteredCategories: Category[] = [];
  showCategoryPopover = false;
  private typeSubject$ = new BehaviorSubject<'income' | 'outcome'>('outcome');
  private categoriesLoaded = false;
  private initialized = false;

  vm$ = combineLatest([toObservable(this.state.loading)]).pipe(
    map(([isLoading]) => ({ isLoading }))
  );

  constructor(private profileService: ProfileService) {
    super();
  }

  override ngOnInit() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    super.ngOnInit();
    this.isEditMode = !!this.expense;
    this.userCurrency = this.profileService.getProfile()?.currency || 'USD';
    this.initForm();
    if (!this.categoriesLoaded) {
      this.loadCategories();
    }
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.formContainerRef?.nativeElement) {
        trapFocus(
          this.formContainerRef.nativeElement.closest(
            'ion-modal, .main-modal, .modal-wrapper'
          ) || this.formContainerRef.nativeElement
        );
      }
    }, 400);
  }

  private initForm(): void {
    const categoryObj =
      this.expense?.category && typeof this.expense.category !== 'string'
        ? this.expense.category
        : null;
    const type = categoryObj?.type || 'outcome';
    const categoryId =
      categoryObj?._id ||
      (typeof this.expense?.category === 'string'
        ? this.expense.category
        : null);

    this.expenseForm = this.fb.group({
      type: [type],
      amount: [
        this.expense?.amount,
        [Validators.required, Validators.min(0.01)],
      ],
      category: [categoryId, Validators.required],
      description: [this.expense?.description, Validators.required],
      date: [
        this.expense?.date || new Date().toISOString(),
        Validators.required,
      ],
    });

    // Initialize typeSubject with the initial type
    this.typeSubject$.next(type);
    
    // Subscribe to type changes to update filtered categories
    this.typeSubject$.pipe(takeUntil(this.destroy$)).subscribe((t) => {
      this.filteredCategories = this.allCategories.filter((c) => c.type === t || (!c.type && t === 'outcome'));
      
      // Reset category if current selection doesn't match new type
      const currentCategoryId = this.expenseForm.get('category')?.value;
      if (currentCategoryId) {
        const currentCategory = this.allCategories.find(c => c._id === currentCategoryId);
        if (currentCategory && currentCategory.type !== t) {
          this.expenseForm.get('category')?.setValue('');
        }
      }
      this.cdr.markForCheck();
    });
  }

  private loadCategories(): void {
    if (this.categoriesLoaded) {
      return;
    }
    this.categoriesLoaded = true;

    this.categoryService
      .getCategories({ skip: 0, limit: 200, sort: 'order' })
      .pipe(
        map((res) => res.data || []),
        takeUntil(this.destroy$)
      )
      .subscribe((categories) => {
        this.allCategories = categories;
        this.typeSubject$.next(this.typeSubject$.value); // Trigger filtering again now that we have data
        this.cdr.markForCheck();
      });
  }

  async onDelete(): Promise<void> {
    const confirmed = await this.alertService.showDeleteConfirm(
      this.expense?.description || '',
      async () => this.deleteExpense()
    );
  }

  private deleteExpense(): void {
    this.setLoading(true);
    this.expenseService
      .deleteExpense(this.expense!._id)
      .pipe(finalize(() => this.setLoading(false)))
      .subscribe({
        next: () => {
          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('EXPENSE.DELETE_SUCCESS')
          );
          this.modalCtrl?.dismiss(null, 'delete');
        },
        error: (error) =>
          this.handleError(
            this.translateService.instant('EXPENSE.DELETE_ERROR'),
            error,
            true
          ),
      });
  }

  private isSubmitting = false;

  onSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.expenseForm.invalid || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.setLoading(true);
    const formValue = this.expenseForm.value;

    // Remove 'type' from payload - backend determines type from category
    const { type, ...payloadData } = formValue;

    const payload: Partial<Expense> = {
      ...payloadData,
      amount: Number(payloadData.amount),
      date: new Date(payloadData.date).toISOString(),
    };

    const action$ = this.isEditMode
      ? this.expenseService.updateExpense(this.expense!._id, payload)
      : this.expenseService.createExpense(payload);

    action$
      .pipe(
        finalize(() => {
          this.setLoading(false);
          this.isSubmitting = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          const message = this.isEditMode
            ? this.translateService.instant('EXPENSE.UPDATE_SUCCESS')
            : this.translateService.instant('EXPENSE.CREATE_SUCCESS');
          this.toastService.presentSuccessToast('bottom', message);
          this.modalCtrl?.dismiss(response, 'confirm');
        },
        error: (error) => {
          const message = this.isEditMode
            ? this.translateService.instant('EXPENSE.UPDATE_ERROR')
            : this.translateService.instant('EXPENSE.CREATE_ERROR');
          this.handleError(message, error, true);
        },
      });
  }

  close(): void {
    releaseFocus();
    this.modalCtrl?.dismiss();
  }

  // --- Custom Category Popover Logic ---
  openCategoryPopover(event: Event) {
    this.showCategoryPopover = true;
  }

  closeCategoryPopover() {
    this.showCategoryPopover = false;
  }

  selectCategory(id: string) {
    this.expenseForm.get('category')?.setValue(id);
    this.expenseForm.get('category')?.markAsDirty();
    this.closeCategoryPopover();
  }

  getSelectedCategoryText(): string {
    const id = this.expenseForm.get('category')?.value;
    if (!id) return this.translateService.instant('EXPENSE.CATEGORY');
    const category = this.allCategories.find((c) => c._id === id);
    return category?.title || this.translateService.instant('EXPENSE.CATEGORY');
  }

  getSelectedCategoryIcon(): string {
    const id = this.expenseForm.get('category')?.value;
    const category = this.allCategories.find((c) => c._id === id);
    return category?.icon || 'grid-outline';
  }

  getSelectedCategoryColor(): string {
    const id = this.expenseForm.get('category')?.value;
    const category = this.allCategories.find((c) => c._id === id);
    return category?.color || '';
  }

  onDateChange(event: any): void {
    const value = event.detail?.value;
    if (value) {
      this.expenseForm.get('date')?.setValue(value, { emitEvent: false });
      this.cdr.markForCheck();
    }
  }

  changeType(type: 'income' | 'outcome'): void {
    // Update form value and clear category
    this.expenseForm.patchValue({ type, category: '' });
    // Emit the new type to trigger filtering
    this.typeSubject$.next(type);
    this.cdr.markForCheck();
  }
}
