import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, finalize, Observable, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseComponent } from 'src/app/shared/base/base.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent extends BaseComponent implements OnInit {
  loginForm!: FormGroup;
  hide = true;
  private readonly loading = new BehaviorSubject<boolean>(false);
  private readonly errorMessage = new BehaviorSubject<string>('');

  readonly vm$ = combineLatest({
    isLoading: this.loading.asObservable(),
    errorMessage: this.errorMessage.asObservable(),
  });

  // Form control names for template access
  readonly formFields = {
    email: 'email',
    password: 'password',
    rememberMe: 'rememberMe',
  };

  constructor() {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.initForm();
  }

  // Ensure UI resets correctly when returning to login (e.g., after logout)
  ionViewWillEnter(): void {
    this.loading.next(false);
    this.errorMessage.next('');
    if (this.loginForm) {
      this.loginForm.reset({ [this.formFields.rememberMe]: this.loginForm.get(this.formFields.rememberMe)?.value });
    }
  }

  signInWithFacebook(): void {
    this.handleAuth(this.authService.loginWithFacebook());
  }


  togglePasswordVisibility(): void {
    this.hide = !this.hide;
  }

  private initForm(): void {
    const savedEmail = localStorage.getItem('savedEmail') || '';
    const rememberMe = savedEmail !== '';

    this.loginForm = new FormGroup({
      [this.formFields.email]: new FormControl(savedEmail, {
        validators: [Validators.required, Validators.email, Validators.maxLength(100)],
        updateOn: 'blur',
      }),
      [this.formFields.password]: new FormControl('', {
        validators: [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
        updateOn: 'blur',
      }),
      [this.formFields.rememberMe]: new FormControl(rememberMe),
    });
  }

  get email() {
    return this.loginForm.get(this.formFields.email);
  }

  get password() {
    return this.loginForm.get(this.formFields.password);
  }

  signInWithGoogle(): void {
    this.handleAuth(this.authService.loginWithGoogle());
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;

    if (rememberMe) {
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('savedEmail');
    }

    this.handleAuth(this.authService.login(email, password));
  }

  private handleAuth(authObservable: Observable<any>): void {
    this.loading.next(true);
    this.errorMessage.next('');

    authObservable
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.next(false))
      )
      .subscribe({
        next: (res) => {
          // If backend explicitly indicates failure, treat as error
          if (res && res.success === false) {
            const backendMessage: string | undefined = res?.error?.message;
            const message =
              backendMessage ||
              this.translateService.instant('AUTH.LOGIN_ERROR');
            this.errorMessage.next(message);
            this.toastService.presentErrorToast('bottom', message);
            return;
          }

          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('AUTH.LOGIN_SUCCESS')
          );
        },
        error: (error) => {
          const backendMessage: string | undefined =
            error?.error?.error?.message || error?.error?.message;
          let fallbackKey = 'AUTH.LOGIN_ERROR';

          if (error?.status === 401) {
            fallbackKey = 'AUTH.INVALID_CREDENTIALS';
          } else if (error?.status === 0) {
            fallbackKey = 'AUTH.NETWORK_ERROR';
          } else if (error?.status >= 500) {
            fallbackKey = 'AUTH.SERVER_ERROR';
          }

          const message =
            backendMessage || this.translateService.instant(fallbackKey);
          this.errorMessage.next(message);
          this.toastService.presentErrorToast('bottom', message);
        },
      });
  }
}
