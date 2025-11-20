import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, finalize, takeUntil } from 'rxjs';
import { BaseComponent } from 'src/app/shared/base';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss'],
})
export class AddCategoryComponent extends BaseComponent implements OnInit {
  categoryForm!: FormGroup;
  editMode = false;
  categoryId: string | null = null;
  animatePreview = false;
  formSubmitted = false;

  private readonly loading = new BehaviorSubject<boolean>(false);
  private readonly errorMessage = new BehaviorSubject<string>('');
  readonly vm$ = combineLatest({
    isLoading: this.loading.asObservable(),
    errorMessage: this.errorMessage.asObservable(),
  });

  constructor() {
    super();
  }

  override ngOnInit() {
    this.initFormGroup();
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

  private initFormGroup(category?: any): void {
    this.categoryForm = this.fb.group({
      title: [
        category?.title || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^(?!\s*$).+/), // not only whitespace
        ],
      ],
      icon: [category?.icon || 'add', Validators.required],
      color: [category?.color || '#28ba62', Validators.required],
      type: [category?.type || 'outcome', Validators.required],
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
      this.loading.next(true);
      this.errorMessage.next('');
      this.categoryService
        .getCategory(this.categoryId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading.next(false))
        )
        .subscribe({
          next: (category) => {
            this.initFormGroup(category);
          },
          error: (error) => {
            this.errorMessage.next(error.message);
          },
        });
    }
  }

  addCategory(): void {
    this.formSubmitted = true;
    if (this.categoryForm.invalid) {
      return;
    }
    this.loading.next(true);
    this.errorMessage.next('');
    this.categoryService
      .createCategory(this.categoryForm.value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.next(false);
          setTimeout(() => (this.formSubmitted = false), 2000);
        })
      )
      .subscribe({
        next: () => {
          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('CATEGORY.SUCCESSFULLY_ADDED')
          );
          setTimeout(() => {
            this.router.navigate(['/categories/list']);
          }, 1500);
        },
        error: (error) => {
          this.formSubmitted = false;
          this.errorMessage.next(error.message);
        },
      });
  }

  updateCategory(): void {
    if (!this.categoryId) {
      return;
    }

    this.loading.next(true);
    this.errorMessage.next('');
    this.categoryService
      .updateCategory(this.categoryId, this.categoryForm.value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.next(false))
      )
      .subscribe({
        next: () => {
          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('CATEGORY.SUCCESSFULLY_UPDATED')
          );
          this.router.navigate(['/categories/list']);
        },
        error: (error) => {
          this.errorMessage.next(error.message);
        },
      });
  }
}
