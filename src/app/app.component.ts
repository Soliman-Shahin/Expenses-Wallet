import { Component, ChangeDetectionStrategy, NgZone, OnInit, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { BaseComponent } from './shared/base/base.component';
import { DirectionService } from './core/services/direction.service';
import { TranslateService } from '@ngx-translate/core';
import { OnboardingService } from './core/services/onboarding.service';
import { BiometricService } from './core/services/biometric.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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

    // Initialize GoogleAuth for web/development
    this.initializeGoogleAuth();

    // Check biometric on startup
    this.checkBiometric();
    
    // Handle web OAuth callback after redirect
    this.handleWebOAuthCallback();

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

  private handleWebOAuthCallback(): void {
    // Check if we're on the OAuth callback page
    const hash = window.location.hash;
    if (hash && hash.includes('payload=')) {
      try {
        const params = new URLSearchParams(hash.substring(1));
        const payloadB64 = params.get('payload');
        
        if (payloadB64) {
          console.log('🔵 [AppComponent] Handling web OAuth callback...');
          this.authService.handleOAuthDeepLink(payloadB64).subscribe({
            next: () => {
              console.log('✅ [AppComponent] OAuth callback handled successfully');
              // Clear the hash and redirect to home
              window.location.hash = '';
              this.zone.run(() => this.router.navigateByUrl('/home'));
            },
            error: (err) => {
              console.error('❌ [AppComponent] OAuth callback failed:', err);
              this.handleError('Failed to handle OAuth redirect.', err, true);
            },
          });
        }
      } catch (err) {
        console.error('❌ [AppComponent] Failed to parse OAuth callback:', err);
        this.handleError('Failed to parse OAuth callback.', err, true);
      }
    }
  }

  private initializeGoogleAuth() {
    try {
      // Initialize GoogleAuth for web platform
      GoogleAuth.initialize({
        clientId: '358709669585-0td9nf2p58ncgtoreopgqkq7vosco473.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      console.log('✅ GoogleAuth initialized successfully');
    } catch (error) {
      console.warn('⚠️ GoogleAuth initialization failed (normal on native):', error);
    }
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
