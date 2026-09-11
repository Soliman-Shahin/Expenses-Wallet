import {
  Component,
  ChangeDetectionStrategy,
  NgZone,
  OnInit,
  inject,
} from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
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
import { takeUntil } from 'rxjs/operators';
import { PushNotificationService } from './core/services/push-notification.service';
import { ConnectionService } from './core/services/connection.service';
import { DeviceLockService } from './core/services/device-lock.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LayoutComponent, OnboardingComponent, IonicModule, TranslateModule],
})
export class AppComponent extends BaseComponent implements OnInit {
  isLocked = false;
  private isAuthenticating = false;
  private deviceLockUnsubscribe?: () => Promise<void>;
  private backgroundedAt: number | null = null;

  constructor(
    private zone: NgZone,
    private translate: TranslateService,
    private directionService: DirectionService,
    public onboardingService: OnboardingService,
    private biometricService: BiometricService,
    private backupService: BackupService,
    private pushNotificationService: PushNotificationService,
    private connectionService: ConnectionService,
    private deviceLockService: DeviceLockService
  ) {
    super();
    this.translate.setDefaultLang('en');
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.connectionService.initialize();
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(console.warn);
    }

    // Initialize GoogleAuth for web/development
    this.initializeGoogleAuth();

    // Initialize Google Drive for Backup
    this.initializeGoogleDrive();

    // Check biometric on startup
    this.checkBiometric();
    if (Capacitor.isNativePlatform()) {
      void this.deviceLockService.listen(() => {
        if (this.tokenService.hasRestoredSession() || this.authService.isLoggedIn) {
          this.isLocked = true;
          this.tokenService.requireBiometricUnlock();
          this.cdr.markForCheck();
        }
      }).then((unsubscribe) => { this.deviceLockUnsubscribe = unsubscribe; });
    }

    // Handle web OAuth callback after redirect
    this.handleWebOAuthCallback();

    if (Capacitor.isNativePlatform()) {
      void this.pushNotificationService.initializeIfEnabled().then(() => {
        this.authService.user$
          .pipe(takeUntil(this.destroy$))
          .subscribe((user) => {
            if (user) {
              void this.pushNotificationService.initializeIfEnabled();
            }
          });
      });
    }

    // Record only genuine application backgrounding. Native biometric dialogs
    // can emit pause/resume; those must not start or reset the grace period.
    App.addListener('pause', () => {
      if (!this.isAuthenticating) this.backgroundedAt = Date.now();
    });

    // Check on resume
    App.addListener('resume', () => {
      if (this.isAuthenticating) return;
      // Ignore resume if it happened within 2 seconds of a biometric prompt finishing.
      // This prevents the infinite loop caused by the biometric dialog itself triggering a pause/resume cycle.
      if (Date.now() - this.biometricService.lastBiometricTime < 2000) {
        return;
      }
      if (
        this.backgroundedAt !== null &&
        Date.now() - this.backgroundedAt < 30_000
      ) {
        this.backgroundedAt = null;
        return;
      }
      this.backgroundedAt = null;
      void this.checkBiometric();
    });

    // Handle OAuth and the narrowly-scoped password-reset deep link.
    const handleNativeUrl = (event: { url: string }) => {
      try {
        const url = event?.url || '';
        const parsed = new URL(url);
        if (
          parsed.protocol === 'expenseswallet:' &&
          parsed.hostname === 'auth'
        ) {
          const token =
            parsed.pathname === '/reset-password'
              ? parsed.searchParams.get('token')
              : null;
          if (token) {
            this.zone.run(
              () =>
                void this.router.navigate(['/auth/reset-password'], {
                  queryParams: { token },
                })
            );
          }
          return;
        }
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
    };
    App.addListener('appUrlOpen', handleNativeUrl);
    void App.getLaunchUrl().then((event) => {
      if (event?.url) handleNativeUrl(event);
    });
  }

  override ngOnDestroy(): void {
    void this.deviceLockUnsubscribe?.();
    super.ngOnDestroy();
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
              console.log(
                '✅ [AppComponent] OAuth callback handled successfully'
              );
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
        clientId:
          '358709669585-0td9nf2p58ncgtoreopgqkq7vosco473.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      console.log('✅ GoogleAuth initialized successfully');
    } catch (error) {
      console.warn(
        '⚠️ GoogleAuth initialization failed (normal on native):',
        error
      );
    }
  }

  private async initializeGoogleDrive() {
    try {
      if (
        environment.googleDriveClientId &&
        environment.googleDriveClientId !==
          'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com'
      ) {
        await this.backupService.initializeGoogleDrive(
          environment.googleDriveClientId
        );
        console.log('✅ Google Drive initialized successfully');
      } else {
        console.warn(
          '⚠️ Google Drive Client ID not configured. Please add it to environment files.'
        );
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive:', error);
    }
  }

  async checkBiometric() {
    if (this.isAuthenticating) return;
    if (Date.now() - this.biometricService.lastBiometricTime < 2000) return;

    const requiresUnlock = this.tokenService.isBiometricUnlockRequired();
    const hasSession =
      this.tokenService.hasRestoredSession() || this.authService.isLoggedIn;
    if (
      !Capacitor.isNativePlatform() ||
      !hasSession ||
      (!this.biometricService.isEnabled && !requiresUnlock)
    )
      return true;
    this.isLocked = true;
    this.isAuthenticating = true;

    if (
      (this.biometricService.isEnabled || requiresUnlock) &&
      (await this.biometricService.isAvailable())
    ) {
      this.isLocked = true;
      this.cdr.markForCheck();

      // Small delay to ensure UI updates
      setTimeout(async () => {
        try {
          const authenticated = await this.biometricService.verifyIdentity();
          if (authenticated) {
            this.tokenService.unlockBiometricSession();
            this.isLocked = false;
            this.backgroundedAt = null;
            void this.authService.renewIfNeeded().catch(() => undefined);
          }
        } catch (e) {
          console.error('Biometric check failed', e);
        } finally {
          this.isAuthenticating = false;
          this.cdr.markForCheck();
        }
      }, 100);
    } else {
      this.isAuthenticating = false;
      this.cdr.markForCheck();
    }
    return false;
  }
}
