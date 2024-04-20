import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, TokenService } from 'src/app/shared/services';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  signupForm: FormGroup;
  hide = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private translateService: TranslateService,
    private routerService: Router
  ) {
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

  async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle().subscribe((data: any) => {
        console.log('Signed In With Google');
        console.log(data);
      });
      // No need to reload the window
    } catch (error) {
      console.log('Error signing in with Google:', error);
    }
  }

  signup(): void {
    if (this.signupForm.valid) {
      const { email, password } = this.signupForm.value;
      this.authService.signup(email, password).then((res: any) => {
        if (res?.status === 200) {
          this.routerService.navigate(['/home/login']);
        } else {
        }
      });
    } else {
    }
  }
}
