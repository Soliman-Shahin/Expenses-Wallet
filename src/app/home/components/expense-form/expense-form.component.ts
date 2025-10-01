import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith, finalize } from 'rxjs/operators';

import { BaseComponent } from 'src/app/shared/base/base.component';
import { Expense, Category } from 'src/app/shared/models';
import { ProfileService } from 'src/app/modules/profile/services/profile.service';
import { trapFocus, releaseFocus } from 'src/app/shared/utils/focus-trap';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss'],
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

  private allCategories: Category[] = [];
  filteredCategories$!: Observable<Category[]>;

  vm$ = combineLatest([toObservable(this.state.loading)]).pipe(
    map(([isLoading]) => ({ isLoading }))
  );

  constructor(
    private alertController: AlertController,
    private profileService: ProfileService,
    public translate: TranslateService
  ) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.isEditMode = !!this.expense;
    this.userCurrency = this.profileService.getProfile()?.currency || 'USD';
    this.initForm();
    this.loadCategories();
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

    this.filteredCategories$ = this.expenseForm.get('type')!.valueChanges.pipe(
      startWith(type),
      map((t) => this.allCategories.filter((c) => c.type === t))
    );
  }

  private loadCategories(): void {
    this.categoryService
      .getCategories({ skip: 0, limit: 200, sort: 'order' })
      .pipe(map((res) => res.data || []))
      .subscribe((categories) => {
        this.allCategories = categories;
        // Trigger the filtering initially
        this.expenseForm
          .get('type')!
          .updateValueAndValidity({ emitEvent: true });
      });
  }

  async onDelete(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translate.instant('COMMON.CONFIRM_DELETE'),
      message: this.translate.instant('EXPENSE.DELETE_CONFIRM_MSG'),
      buttons: [
        { text: this.translate.instant('COMMON.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('COMMON.DELETE'),
          role: 'destructive',
          handler: () => this.deleteExpense(),
        },
      ],
    });
    await alert.present();
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
            this.translate.instant('EXPENSE.DELETE_SUCCESS')
          );
          this.modalCtrl?.dismiss(null, 'delete');
        },
        error: (error) =>
          this.handleError(
            this.translate.instant('EXPENSE.DELETE_ERROR'),
            error,
            true
          ),
      });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      return;
    }
    this.setLoading(true);
    const formValue = this.expenseForm.value;
    const payload: Partial<Expense> = {
      ...formValue,
      amount: Number(formValue.amount),
      date: new Date(formValue.date).toISOString(),
    };

    const action$ = this.isEditMode
      ? this.expenseService.updateExpense(this.expense!._id, payload)
      : this.expenseService.createExpense(payload);

    action$.pipe(finalize(() => this.setLoading(false))).subscribe({
      next: (response) => {
        const message = this.isEditMode
          ? this.translate.instant('EXPENSE.UPDATE_SUCCESS')
          : this.translate.instant('EXPENSE.CREATE_SUCCESS');
        this.toastService.presentSuccessToast('bottom', message);
        this.modalCtrl?.dismiss(response, 'confirm');
      },
      error: (error) => {
        const message = this.isEditMode
          ? this.translate.instant('EXPENSE.UPDATE_ERROR')
          : this.translate.instant('EXPENSE.CREATE_ERROR');
        this.handleError(message, error, true);
      },
    });
  }

  close(): void {
    releaseFocus();
    this.modalCtrl?.dismiss();
  }
}
