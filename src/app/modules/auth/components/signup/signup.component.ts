import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/base';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent extends BaseComponent {
  signupForm: FormGroup;
  hide = true;

  constructor() {
    super();
    this.signupForm = this.initForm();
  }

  togglePasswordVisibility() {
    this.hide = !this.hide;
  }

  private initForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  // getEmailErrorMessage(): string {
  //   const emailControl = this.signupForm.get('email');
  //   if (emailControl?.errors?.['required']) {
  //     return 'You must enter a value';
  //   }
  //   return emailControl?.errors?.['email'] ? 'Not a valid email' : '';
  // }

  signInWithGoogle() {
    console.log('Sign in with Google');
  }

  signup(): void {
    if (this.signupForm.valid) {
      const { email, password } = this.signupForm.value;
      this.authService
        .signup(email, password)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res?.status === 200) {
              this.routerService.navigate(['/auth/login']);
            }
          },
          error: (error) => {
            console.log('Error during signup:', error);
          },
        });
    }
  }
}
