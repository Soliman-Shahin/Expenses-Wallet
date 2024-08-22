import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { BaseComponent } from 'src/app/shared/base';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent extends BaseComponent {
  loginForm!: FormGroup;

  hide: boolean = true;

  constructor() {
    super();
    this.initForm();
  }

  togglePasswordVisibility() {
    this.hide = !this.hide;
  }

  initForm() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });
  }

  signInWithGoogle() {

  }

  login(data: any) {
    this.authService
      .login(data.email, data.password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.status === 200) {
            this.tokenService.setUser(res?.body);
            this.tokenService.setUserLang(this.translate.getCurrentLanguage());
            this.toastService.presentSuccessToast(
              'bottom',
              'Action was successful!'
            );
            this.routerService.navigate(['/']);
          }
        },
        error: (error) => {
          console.error('Error during login:', error);
          this.toastService.presentErrorToast('bottom', 'Action failed!');
        },
      });
  }
}
