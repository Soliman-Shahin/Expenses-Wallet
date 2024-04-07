import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../../shared/services';

@Component({
  selector: 'app-phone-login',
  templateUrl: './phone-login.component.html',
  styleUrls: ['./phone-login.component.scss'],
})
export class PhoneLoginComponent implements AfterViewInit {
  @ViewChild('recaptchaContainer') recaptchaContainer!: ElementRef;

  phoneNumber: string = '';
  verificationCode: string = '';
  confirmationResult: any;

  constructor(private authService: AuthService) {}

  ngAfterViewInit() {
    this.authService.initializeRecaptcha(this.recaptchaContainer.nativeElement);
  }

  async onSignInWithPhoneNumber() {
    this.confirmationResult = await this.authService.signInWithPhoneNumber(
      this.phoneNumber
    );
  }

  async onVerifyPhoneNumber() {
    await this.authService.verifyPhoneNumber(this.verificationCode);
  }
}
