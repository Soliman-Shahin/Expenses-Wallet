import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BiometricSignInService } from '../services/biometric-signin.service';

const same = (control: AbstractControl): ValidationErrors | null =>
  control.get('password')?.value === control.get('confirm')?.value
    ? null
    : { mismatch: true };

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    AsyncPipe,
  ],
  template: ` <ion-content
    ><main class="recovery">
      <div class="recovery-card">
        <img src="assets/icon/icon.png" alt="Expenses Wallet" />
        <h1>{{ 'AUTH.RECOVERY_TITLE' | translate }}</h1>
        <p>{{ 'AUTH.RECOVERY_SUBTITLE' | translate }}</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <ion-item
            ><ion-input
              type="email"
              formControlName="email"
              [placeholder]="'AUTH.EMAIL_PLACEHOLDER' | translate"
            ></ion-input></ion-item
          ><ion-button
            expand="block"
            type="submit"
            [disabled]="form.invalid || loading()"
            >{{ 'AUTH.SEND_RESET' | translate }}</ion-button
          >
        </form>
        @if (sent()) {
        <p class="success">{{ 'AUTH.RECOVERY_GENERIC' | translate }}</p>
        }<a routerLink="/auth/login">{{ 'AUTH.BACK_TO_LOGIN' | translate }}</a>
      </div>
    </main></ion-content
  >`,
  styles: [
    `
      .recovery {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: 24px;
        background: var(--ion-background-color);
      }
      .recovery-card {
        width: min(100%, 440px);
        padding: 32px;
        border-radius: 28px;
        background: var(--ion-card-background);
        box-shadow: 0 18px 50px #0002;
        text-align: center;
      }
      .recovery-card img {
        width: 64px;
        border-radius: 16px;
      }
      .recovery-card h1 {
        color: var(--ion-text-color);
      }
      .recovery-card p {
        color: var(--ion-color-medium);
      }
      ion-item {
        margin: 20px 0 14px;
        border-radius: 14px;
      }
      .success {
        color: var(--ion-color-success) !important;
        margin: 16px 0;
      }
      .recovery-card a {
        color: var(--ion-color-primary);
        display: inline-block;
        margin-top: 20px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  private loadingState = new BehaviorSubject(false);
  private sentState = new BehaviorSubject(false);
  loading = () => this.loadingState.value;
  sent = () => this.sentState.value;
  submit() {
    if (this.form.invalid) return;
    this.loadingState.next(true);
    this.auth
      .requestPasswordReset(this.form.value.email!)
      .pipe(finalize(() => this.loadingState.next(false)))
      .subscribe({
        next: () => this.sentState.next(true),
        error: () => this.sentState.next(true),
      });
  }
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: ` <ion-content
    ><main class="recovery">
      <div class="recovery-card">
        <img src="assets/icon/icon.png" alt="Expenses Wallet" />
        <h1>{{ 'AUTH.RESET_PASSWORD' | translate }}</h1>
        @if (!token) {
        <p>{{ 'AUTH.RESET_INVALID' | translate }}</p>
        } @else if (done()) {
        <p class="success">{{ 'AUTH.RESET_SUCCESS' | translate }}</p>
        } @else if (error()) {
        <p class="error">{{ 'AUTH.RESET_INVALID' | translate }}</p>
        } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <ion-item
            ><ion-input
              type="password"
              formControlName="password"
              [placeholder]="'AUTH.NEW_PASSWORD' | translate"
            ></ion-input></ion-item
          ><ion-item
            ><ion-input
              type="password"
              formControlName="confirm"
              [placeholder]="'AUTH.CONFIRM_PASSWORD' | translate"
            ></ion-input></ion-item
          >@if(form.hasError('mismatch')){
          <p class="error">{{ 'AUTH.PASSWORD_MISMATCH' | translate }}</p>
          }<ion-button
            expand="block"
            type="submit"
            [disabled]="form.invalid || loading()"
            >{{ 'AUTH.RESET_PASSWORD' | translate }}</ion-button
          >
        </form>
        }<a routerLink="/auth/login">{{ 'AUTH.BACK_TO_LOGIN' | translate }}</a>
      </div>
    </main></ion-content
  >`,
  styles: [
    `
      .recovery {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: 24px;
        background: var(--ion-background-color);
      }
      .recovery-card {
        width: min(100%, 440px);
        padding: 32px;
        border-radius: 28px;
        background: var(--ion-card-background);
        box-shadow: 0 18px 50px #0002;
        text-align: center;
      }
      .recovery-card img {
        width: 64px;
        border-radius: 16px;
      }
      .recovery-card h1 {
        color: var(--ion-text-color);
      }
      .recovery-card p {
        color: var(--ion-color-medium);
      }
      ion-item {
        margin: 12px 0;
        border-radius: 14px;
      }
      .success {
        color: var(--ion-color-success) !important;
      }
      .error {
        color: var(--ion-color-danger) !important;
      }
      .recovery-card a {
        color: var(--ion-color-primary);
        display: inline-block;
        margin-top: 20px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private auth = inject(AuthService);
  private biometricSignIn = inject(BiometricSignInService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  token = this.route.snapshot.queryParamMap.get('token');
  private loadingState = new BehaviorSubject(false);
  private doneState = new BehaviorSubject(false);
  private errorState = new BehaviorSubject(false);
  loading = () => this.loadingState.value;
  done = () => this.doneState.value;
  error = () => this.errorState.value;
  form = new FormGroup(
    {
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      confirm: new FormControl('', Validators.required),
    },
    { validators: same }
  );
  submit() {
    if (!this.token || this.form.invalid) return;
    this.loadingState.next(true);
    this.auth
      .resetPassword(this.token, this.form.value.password!)
      .pipe(finalize(() => this.loadingState.next(false)))
      .subscribe({
        next: () => {
          void this.biometricSignIn.clearLocalEnrollment();
          this.doneState.next(true);
          void this.router.navigateByUrl('/auth/login');
        },
        error: () => this.errorState.next(true),
      });
  }
}
