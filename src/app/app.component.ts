import { Component, ChangeDetectionStrategy, NgZone, OnInit, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { BaseComponent } from './shared/base/base.component';
import { DirectionService } from './core/services/direction.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { OnboardingService } from './core/services/onboarding.service';
import { BiometricService } from './core/services/biometric.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { BackupService } from './core/services/backup.service';
import { environment } from '../environments/environment';
import { LayoutComponent } from './layout/pages/layout-component/layout.component';
import { OnboardingComponent } from './shared/components/onboarding/onboarding.component';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LayoutComponent, OnboardingComponent, IonicModule, TranslateModule]
})
export class AppComponent extends BaseComponent implements OnInit {
  isLocked = false;
  private isAuthenticating = false;

  constructor(
    private zone: NgZone,
    private translate: TranslateService,
    private directionService: DirectionService,
    public onboardingService: OnboardingService,
    private biometricService: BiometricService,
    private backupService: BackupService
  ) {
    super();
    this.translate.setDefaultLang('en');
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.themeService.initTheme();

    // Initialize GoogleAuth for web/development
    this.initializeGoogleAuth();

    // Initialize Google Drive for Backup
    this.initializeGoogleDrive();

    // Check biometric on startup
    this.checkBiometric();
    
    // Handle web OAuth callback after redirect
    this.handleWebOAuthCallback();

    // Check on resume
    App.addListener('resume', () => {
      // Ignore resume if it happened within 2 seconds of a biometric prompt finishing.
      // This prevents the infinite loop caused by the biometric dialog itself triggering a pause/resume cycle.
      if (Date.now() - this.biometricService.lastBiometricTime < 2000) {
        return;
      }
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

  private async initializeGoogleDrive() {
    try {
      if (environment.googleDriveClientId && environment.googleDriveClientId !== 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
        await this.backupService.initializeGoogleDrive(environment.googleDriveClientId);
        console.log('✅ Google Drive initialized successfully');
      } else {
        console.warn('⚠️ Google Drive Client ID not configured. Please add it to environment files.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive:', error);
    }
  }

  async checkBiometric() {
    if (this.isAuthenticating) return;

    if (
      this.biometricService.isEnabled &&
      (await this.biometricService.isAvailable())
    ) {
      this.isLocked = true;
      this.isAuthenticating = true;
      this.cdr.markForCheck();
      
      // Small delay to ensure UI updates
      setTimeout(async () => {
        try {
          const authenticated = await this.biometricService.verifyIdentity();
          if (authenticated) {
            this.isLocked = false;
          }
        } catch (e) {
          console.error('Biometric check failed', e);
        } finally {
          this.isAuthenticating = false;
          this.cdr.markForCheck();
        }
      }, 100);
    }
  }
}
