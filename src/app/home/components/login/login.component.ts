import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Component } from '@angular/core';
import {
  AuthService,
  TokenService,
  TranslationService,
} from 'src/app/shared/services';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm!: FormGroup;

  hide: boolean = true;

  constructor(
    private fb: FormBuilder,
    private toastController: ToastController,
    private authService: AuthService,
    private tokenService: TokenService,
    private translate: TranslationService,
    private routerService: Router
  ) {
    this.initForm();
  }

  togglePasswordVisibility() {
    this.hide = !this.hide;
  }

  initForm() {
    this.loginForm = this.fb.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });
  }

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

  login(data: any): void {
    this.authService.login(data.email, data.password).then((res) => {
      if (res?.status === 200) {
        this.tokenService.setUser(res?.body);
        this.tokenService.setUserLang(this.translate.getCurrentLanguage());
        this.routerService.navigate(['/']);
      } else {
        this.presentToast('bottom', res.message);
      }
    });
  }

  async presentToast(position: 'top' | 'middle' | 'bottom', message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: position,
    });

    await toast.present();
  }

  async openToast() {
    const toast = await this.toastController.create({
      message: 'This toast will disappear after 5 seconds',
      duration: 2000,
    });
    toast.present();
  }
}
