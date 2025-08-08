import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs';

import { BaseComponent } from 'src/app/shared/base/base.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent extends BaseComponent {
  loginForm!: FormGroup;
  hide = true;
  errorMessage = '';

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
    this.initForm();
  }

  // Ensure UI resets correctly when returning to login (e.g., after logout)
  ionViewWillEnter(): void {
    this.setLoading(false);
    this.errorMessage = '';
    if (this.loginForm) {
      this.loginForm.markAsPristine();
      this.loginForm.markAsUntouched();
      this.loginForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    }
  }

  signInWithFacebook(): void {
    this.authService
      .loginWithFacebook()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.setLoading(false))
      )
      .subscribe({
        next: () => {
          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('AUTH.LOGIN_SUCCESS')
          );
        },
        error: (error: any) => {
          console.error('Login error:', error);
          this.errorMessage =
            error?.error?.message ||
            this.translateService.instant('AUTH.LOGIN_ERROR');
          this.toastService.presentErrorToast('bottom', this.errorMessage);
        },
      });
  }

  togglePasswordVisibility(): void {
    this.hide = !this.hide;
  }

  private initForm(): void {
    // Try to get saved credentials if they exist
    const savedEmail = localStorage.getItem('savedEmail') || '';
    const rememberMe = savedEmail !== '';

    this.loginForm = new FormGroup({
      [this.formFields.email]: new FormControl(savedEmail, [
        Validators.required,
        Validators.email,
        Validators.maxLength(100),
      ]),
      [this.formFields.password]: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
      ]),
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
    this.authService
      .loginWithGoogle()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.setLoading(false))
      )
      .subscribe({
        next: () => {
          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('AUTH.LOGIN_SUCCESS')
          );
        },
        error: (error: any) => {
          console.error('Login error:', error);
          this.errorMessage =
            error?.error?.message ||
            this.translateService.instant('AUTH.LOGIN_ERROR');
          this.toastService.presentErrorToast('bottom', this.errorMessage);
        },
      });
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.setLoading(true);
    this.errorMessage = '';
    const { email, password, rememberMe } = this.loginForm.value;
    const credentials = { email, password };

    // Handle remember me functionality (only email)
    if (rememberMe) {
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('savedEmail');
    }

    this.authService
      .login(credentials.email, credentials.password)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.setLoading(false))
      )
      .subscribe({
        next: () => {
          // Navigation and state are handled by the AuthService.
          // We just show a success message here.
          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('AUTH.LOGIN_SUCCESS')
          );
        },
        error: (error) => {
          console.error('Login error:', error);
          let errorMessage = 'AUTH.LOGIN_ERROR';

          // Handle specific error cases
          if (error.status === 401) {
            errorMessage = 'AUTH.INVALID_CREDENTIALS';
          } else if (error.status === 0) {
            errorMessage = 'AUTH.NETWORK_ERROR';
          } else if (error.status >= 500) {
            errorMessage = 'AUTH.SERVER_ERROR';
          }

          this.errorMessage = this.translateService.instant(errorMessage);
          this.toastService.presentErrorToast('bottom', this.errorMessage);
        },
      });
  }
}
