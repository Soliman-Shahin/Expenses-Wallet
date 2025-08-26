import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs';
import { BaseComponent } from 'src/app/shared/base';

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
  formSubmitted = false;

  constructor() {
    super();
  }

  override ngOnInit() {
    this.activatedRoute.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.categoryId = params['id'];
        this.editMode = !!this.categoryId;
        if (this.editMode) {
          this.loadCategory();
        }
      });

    // Animate preview on title changes
    const titleCtrl = this.categoryForm.get('title');
    titleCtrl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.bumpPreview());
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

  selectColor(color: string) {
    this.categoryForm.patchValue({ color });
    this.bumpPreview();
    this.addHapticFeedback();
  }

  selectIcon(icon: string) {
    this.categoryForm.patchValue({ icon });
    this.bumpPreview();
    this.addHapticFeedback();
  }

  private addHapticFeedback() {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
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
    this.formSubmitted = true;
    this.categoryService
      .createCategory(this.categoryForm.value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.setLoading(false);
          setTimeout(() => this.formSubmitted = false, 2000);
        })
      )
      .subscribe({
        next: () => {
          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('CATEGORY_SUCCESSFULLY_CREATED')
          );
          setTimeout(() => {
            this.router.navigate(['/categories/list']);
          }, 1500);
        },
        error: (error) => {
          this.formSubmitted = false;
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
