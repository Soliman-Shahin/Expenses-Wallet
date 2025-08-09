import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';

import { BaseComponent } from 'src/app/shared/base/base.component';
import { Expense, Category } from 'src/app/shared/models';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss'],
})
export class ExpenseFormComponent extends BaseComponent implements OnInit {
  @Input() expense?: Expense;
  @Input() onClose: () => void = () => {};

  expenseForm!: FormGroup;
  categories$!: Observable<Category[]>;
  isEditMode = false;
  minDate = '2000-01-01';
  maxDate = '2100-12-31';
  submitting = false;

  override ngOnInit() {
    super.ngOnInit();
    this.isEditMode = !!this.expense;
    this.initForm();
    this.loadCategories();
  }

  private initForm() {
    let categoryId = '';
    if (this.expense?.category) {
      categoryId = this.getCategoryId(this.expense.category);
    }

    this.expenseForm = this.fb.group({
      description: [
        this.expense?.description || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^(?=.*\S).+$/), // no all-whitespace
        ],
      ],
      amount: [
        this.expense?.amount || '',
        [Validators.required, Validators.min(0.01)],
      ],
      date: [
        this.expense
          ? new Date(this.expense.date).toISOString()
          : new Date().toISOString(),
        Validators.required,
      ],
      category: [categoryId, Validators.required],
    });
  }

  private loadCategories() {
    this.categories$ = this.categoryService
      .getCategories({
        skip: 0,
        limit: 100,
        sort: 'name',
      })
      .pipe(
        map((res) =>
          (res.data || []).map((c: any) => ({ ...c, name: c.title }))
        )
      );
  }

  private getCategoryId(category: Category | string): string {
    if (!category) return '';
    return typeof category === 'string' ? category : category._id;
  }

  onCancel() {
    if (this.modalCtrl) {
      this.modalCtrl.dismiss();
    } else if (this.onClose) {
      this.onClose();
    }
  }

  onSubmit() {
    if (this.expenseForm.invalid) {
      return;
    }
    this.submitting = true;

    const { description, amount, date, category } = this.expenseForm.value;
    const payload: Partial<Expense> = {
      description: (description || '').trim(),
      amount: Number(amount),
      date: new Date(date).toISOString(),
      category,
    } as any;
    let action$: Observable<Expense>;

    if (this.isEditMode) {
      action$ = this.expenseService.updateExpense(this.expense!._id, payload);
    } else {
      action$ = this.expenseService.createExpense(payload);
    }

    action$.subscribe({
      next: async (response) => {
        const message = this.isEditMode
          ? 'Expense updated successfully'
          : 'Expense created successfully';
        const toast = await this.toastCtrl?.create({
          message,
          duration: 2000,
          color: 'success',
        });
        toast?.present();
        this.modalCtrl?.dismiss(response, 'confirm');
        this.submitting = false;
      },
      error: async (error) => {
        const message = this.isEditMode
          ? 'Failed to update expense'
          : 'Failed to create expense';
        const toast = await this.toastCtrl?.create({
          message,
          duration: 2000,
          color: 'danger',
        });
        toast?.present();
        console.error(message, error);
        this.submitting = false;
      },
    });
  }

  close() {
    this.modalCtrl?.dismiss();
  }
}