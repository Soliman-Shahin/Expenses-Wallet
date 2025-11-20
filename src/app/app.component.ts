import { Component, NgZone, OnInit, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { BaseComponent } from './shared/base/base.component';
import { DirectionService } from './core/services/direction.service';
import { TranslateService } from '@ngx-translate/core';
import { OnboardingService } from './core/services/onboarding.service';
import { BiometricService } from './core/services/biometric.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent extends BaseComponent implements OnInit {
  isLocked = false;

  constructor(
    private zone: NgZone,
    private translate: TranslateService,
    private directionService: DirectionService,
    public onboardingService: OnboardingService,
    private biometricService: BiometricService
  ) {
    super();
    this.translate.setDefaultLang('en');
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.themeService.initTheme();

    // Check biometric on startup
    this.checkBiometric();

    // Check on resume
    App.addListener('resume', () => {
      this.checkBiometric();
    });

    // Handle OAuth deep link redirects on native (Android/iOS)
    App.addListener('appUrlOpen', (event: { url: string }) => {
      try {
        const url = event?.url || '';
        // Expect shape: scheme://...#payload=<base64>
        const hash = url.split('#')[1] || '';
        const params = new URLSearchParams(hash);
        const payloadB64 = params.get('payload');

        if (payloadB64) {
          this.authService.handleOAuthDeepLink(payloadB64).subscribe({
            next: () => {
              this.zone.run(() => this.router.navigateByUrl('/home'));
            },
            error: (err) => {
              this.handleError('Failed to handle OAuth redirect.', err, true);
            },
          });
        }
      } catch (err) {
        this.handleError('Failed to parse deep link.', err, true);
      }
    });
  }

  async checkBiometric() {
    if (
      this.biometricService.isEnabled &&
      (await this.biometricService.isAvailable())
    ) {
      this.isLocked = true;
      // Small delay to ensure UI updates
      setTimeout(async () => {
        const authenticated = await this.biometricService.verifyIdentity();
        if (authenticated) {
          this.isLocked = false;
        }
      }, 100);
    }
  }
}
