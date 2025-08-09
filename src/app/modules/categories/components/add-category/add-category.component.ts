import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize, map, takeUntil } from 'rxjs';
import { BaseComponent } from 'src/app/shared/base';
import { Category } from '../../models';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss'],
})
export class AddCategoryComponent extends BaseComponent implements OnInit {
  categoryForm: FormGroup = this.initFormGroup();
  editMode = false;
  categoryId: string | null = null;
  animatePreview = false;

  constructor() {
    super();
  }

  override ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.categoryId = params['id'];
      this.editMode = !!this.categoryId;
      if (this.editMode) {
        this.loadCategory();
      }
    });

    this.activatedRoute.data.subscribe((data) => {
      this.headerService.updateButtonConfig({
        title: data['title'],
        action: data['action'],
        icon: data['icon'],
        callback: this.editMode ? this.updateCategory.bind(this) : this.addCategory.bind(this),
      });
    });

    // Animate preview on title changes
    const titleCtrl = this.categoryForm.get('title');
    titleCtrl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.bumpPreview());
  }

  private initFormGroup(): FormGroup {
    return new FormGroup({
      title: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^(?!\s*$).+/), // not only whitespace
      ]),
      icon: new FormControl('add', Validators.required),
      color: new FormControl('#28ba62', Validators.required),
    });
  }

  selectColor(color: any) {
    const control = this.categoryForm.get('color');
    if (control) {
      control.setValue(color.colorCode);
    }
    this.bumpPreview();
  }

  selectIcon(icon: string): void {
    const control = this.categoryForm.get('icon');
    if (control) {
      control.setValue(icon);
    }
    this.bumpPreview();
  }

  private bumpPreview() {
    this.animatePreview = true;
    setTimeout(() => (this.animatePreview = false), 220);
  }

  loadCategory() {
    if (this.categoryId) {
      this.categoryService
        .getCategory(this.categoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((category) => {
          this.categoryForm.patchValue(category);
        });
    }
  }

  addCategory(): void {
    this.setLoading(true);
    this.categoryService
      .createCategory(this.categoryForm.value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.setLoading(false))
      )
      .subscribe({
        next: () => {
          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('CATEGORY_SUCCESSFULLY_CREATED')
          );
          this.router.navigate(['/categories/list']);
        },
        error: (error) => {
          this.toastService.presentErrorToast('bottom', error.message);
        },
      });
  }

  updateCategory(): void {
    if (!this.categoryId) {
      return;
    }

    this.setLoading(true);
    this.categoryService
      .updateCategory(this.categoryId, this.categoryForm.value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.setLoading(false))
      )
      .subscribe({
        next: () => {
          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('CATEGORY_SUCCESSFULLY_UPDATED')
          );
          this.router.navigate(['/categories/list']);
        },
        error: (error) => {
          this.toastService.presentErrorToast('bottom', error.message);
        },
      });
  }
}
