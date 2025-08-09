import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ToastService } from 'src/app/shared/services/toast.service';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/profile.model';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from 'src/app/core/services/loading.service';
import { ItemReorderEventDetail } from '@ionic/angular';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  personalForm!: FormGroup;
  salaryForm!: FormGroup;
  @ViewChild('avatarInput') avatarInputRef!: ElementRef<HTMLInputElement>;
  avatarUrl: string | undefined;
  private destroy$ = new Subject<void>();

  currencies: string[] = [
    'USD',
    'EUR',
    'GBP',
    'SAR',
    'AED',
    'KWD',
    'QAR',
    'BHD',
    'OMR',
    'EGP',
    'MAD',
    'DZD',
    'TND',
  ];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toast: ToastService,
    private loading: LoadingService
  ) {}

  ngOnInit(): void {
    this.personalForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });

    this.salaryForm = this.fb.group({
      details: this.fb.array([], this.duplicateLabelsValidator.bind(this)),
      currency: ['USD', [Validators.required]],
    });

    const existing = this.profileService.getProfile();
    if (existing) {
      this.patchFromProfile(existing);
    }

    // Fetch latest profile from backend
    this.loading.setLoading('profile_fetch', true);
    this.profileService
      .fetchProfile()
      .pipe(
        finalize(() => this.loading.setLoading('profile_fetch', false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (profile) => {
          if (!profile) {
            // keep local cache, optionally notify
          }
        },
        error: () => {
          // handled inside service; keep UX quiet here
        },
      });

    // Subscribe to changes for reactive UI (e.g., avatar preview updates)
    this.profileService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        if (!profile) return;
        // Do not overwrite user's edits while forms are dirty
        const isEditing = this.personalForm.dirty || this.salaryForm.dirty;
        if (isEditing) return;
        this.patchFromProfile(profile);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private patchFromProfile(profile: UserProfile): void {
    this.personalForm.patchValue({
      username: profile.username,
      email: profile.email,
      phone: profile.phone,
    });
    // Patch salary details array
    const arr = this.details;
    while (arr.length) arr.removeAt(0);
    if (Array.isArray(profile.salary) && profile.salary.length) {
      profile.salary.forEach((d) =>
        arr.push(this.createDetailGroup(d.label, d.amount))
      );
    } else {
      // Ensure at least one row exists for UX
      arr.push(this.createDetailGroup('Salary', 0));
    }
    this.salaryForm.patchValue({ currency: profile.currency });
    this.avatarUrl = profile.avatarUrl;
  }

  // Salary details helpers
  get details(): FormArray {
    return this.salaryForm.get('details') as FormArray;
  }

  private createDetailGroup(label: string = '', amount: number = 0) {
    const group = this.fb.group({
      label: [label, [Validators.required, Validators.maxLength(50)]],
      amount: [amount, [Validators.required, Validators.min(0)]],
    });
    // Re-run duplicate validation on label change
    group.get('label')?.valueChanges.subscribe(() => {
      this.details.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      this.salaryForm.markAsDirty();
    });
    group.get('amount')?.valueChanges.subscribe(() => {
      this.details.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      this.salaryForm.markAsDirty();
    });
    return group;
  }

  addDetail(): void {
    this.details.push(this.createDetailGroup('Salary', 0));
    this.details.updateValueAndValidity();
  }

  removeDetail(index: number): void {
    if (this.details.length > 1) {
      this.details.removeAt(index);
      this.details.updateValueAndValidity();
    }
  }

  // Ionic reorder handler for salary details
  onReorder(event: CustomEvent<ItemReorderEventDetail>): void {
    const from = event.detail.from;
    const to = event.detail.to;
    if (from === to) {
      event.detail.complete(true);
      return;
    }
    // Build new order array of existing controls
    const arr = this.details.controls as FormGroup[];
    const reordered = [...arr];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    // Clear and re-push to ensure proper parent binding
    while (this.details.length) {
      this.details.removeAt(0);
    }
    reordered.forEach(ctrl => this.details.push(ctrl));

    this.details.updateValueAndValidity();
    this.salaryForm.markAsDirty();
    event.detail.complete(true);
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Validator to prevent duplicate labels (case-insensitive, trimmed)
  private duplicateLabelsValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const arr = control as FormArray;
    const labels = arr.controls
      .map((c) =>
        String((c.get('label')?.value ?? '').toString().trim().toLowerCase())
      )
      .map((v, idx) => ({ v, idx }));
    const counts = new Map<string, number>();
    labels.forEach(({ v }) => counts.set(v, (counts.get(v) ?? 0) + 1));

    // Mark duplicates on individual controls
    labels.forEach(({ v, idx }) => {
      const ctrl = arr.at(idx).get('label');
      if (!ctrl) return;
      const isDup = v && (counts.get(v) ?? 0) > 1;
      const errors = ctrl.errors ?? {};
      if (isDup) {
        errors['duplicateLabel'] = true;
        ctrl.setErrors(errors);
      } else {
        if (errors['duplicateLabel']) {
          delete errors['duplicateLabel'];
          const hasOther = Object.keys(errors).length > 0 ? errors : null;
          ctrl.setErrors(hasOther);
        }
      }
    });

    // Overall array error if any duplicates
    const anyDup = Array.from(counts.values()).some((c) => c > 1);
    return anyDup ? ({ duplicateLabels: true } as ValidationErrors) : null;
  }

  // Total salary computed from details
  get totalSalary(): number {
    const values = (this.details.value || []) as Array<{ label: string; amount: number }>;
    return values.reduce((sum, d) => sum + (Number(d?.amount) || 0), 0);
  }

  savePersonal(): void {
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      this.toast.presentErrorToast('top', 'PROFILE.TOASTS.PERSONAL_INVALID');
      return;
    }
    this.loading.setLoading('profile_save_personal', true);
    this.profileService
      .updateProfile({ ...(this.personalForm.value as Partial<UserProfile>) })
      .pipe(
        finalize(() => this.loading.setLoading('profile_save_personal', false))
      )
      .subscribe((updated) => {
        if (updated) {
          this.toast.presentSuccessToast(
            'top',
            'PROFILE.TOASTS.PERSONAL_SAVED'
          );
        } else {
          this.toast.presentErrorToast('top', 'PROFILE.TOASTS.PERSONAL_FAILED');
        }
      });
  }

  saveSalary(): void {
    if (this.salaryForm.invalid) {
      this.salaryForm.markAllAsTouched();
      console.warn('Salary form invalid:', this.salaryForm.errors, this.salaryForm);
      this.toast.presentErrorToast('top', 'PROFILE.TOASTS.SALARY_INVALID');
      return;
    }
    this.loading.setLoading('profile_save_salary', true);
    const detailsRaw = this.details.getRawValue() || [];
    const salaryPayload = detailsRaw.map((d: any) => ({
      label: String(d?.label ?? 'Salary'),
      amount: Number(d?.amount ?? 0),
    }));
    const currency = this.salaryForm.get('currency')?.getRawValue();
    const payload: Partial<UserProfile> = {
      salary: salaryPayload,
      currency,
    } as any;

    console.log('[Profile] Saving salary payload:', payload);

    this.profileService
      .updateProfile(payload)
      .pipe(
        finalize(() => this.loading.setLoading('profile_save_salary', false))
      )
      .subscribe((updated) => {
        if (updated) {
          console.log('[Profile] Salary saved, backend responded:', updated);
          this.salaryForm.markAsPristine();
          this.toast.presentSuccessToast('top', 'PROFILE.TOASTS.SALARY_SAVED');
        } else {
          this.toast.presentErrorToast('top', 'PROFILE.TOASTS.SALARY_FAILED');
        }
      });
  }

  triggerAvatarFile(): void {
    this.avatarInputRef?.nativeElement?.click();
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.toast.presentErrorToast('top', 'PROFILE.TOASTS.INVALID_FILE_TYPE');
      input.value = '';
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.toast.presentErrorToast('top', 'PROFILE.TOASTS.FILE_TOO_LARGE');
      input.value = '';
      return;
    }
    
    this.loading.setLoading('profile_avatar_upload', true);
    this.profileService
      .uploadAvatar(file)
      .pipe(
        finalize(() => this.loading.setLoading('profile_avatar_upload', false))
      )
      .subscribe(async (res) => {
        if (res) {
          this.toast.presentSuccessToast('top', 'PROFILE.TOASTS.AVATAR_SAVED');
          // Add a small delay to allow the UI to update before showing the animation
          setTimeout(() => {
            const avatarElement = document.querySelector('.avatar');
            if (avatarElement) {
              avatarElement.classList.add('pulse-on-change');
              setTimeout(() => {
                avatarElement.classList.remove('pulse-on-change');
              }, 300);
            }
          }, 100);
        } else {
          // fallback to local store if backend fails
          const ok = await this.profileService.setAvatar(file);
          if (ok) {
            this.toast.presentSuccessToast(
              'top',
              'PROFILE.TOASTS.AVATAR_SAVED'
            );
            // Add a small delay to allow the UI to update before showing the animation
            setTimeout(() => {
              const avatarElement = document.querySelector('.avatar');
              if (avatarElement) {
                avatarElement.classList.add('pulse-on-change');
                setTimeout(() => {
                  avatarElement.classList.remove('pulse-on-change');
                }, 300);
              }
            }, 100);
          } else {
            this.toast.presentErrorToast('top', 'PROFILE.TOASTS.AVATAR_FAILED');
          }
        }
      });
    // clear selection
    input.value = '';
  }
}
