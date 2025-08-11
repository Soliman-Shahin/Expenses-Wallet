import { Component, NgZone } from '@angular/core';
import { ThemeService } from './shared/services/themeToggle.service';
import { BaseComponent } from './shared/base';
import { App } from '@capacitor/app';
import { AuthService } from './modules/auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
    constructor(
      private themeService: ThemeService,
      private authService: AuthService,
      private zone: NgZone,
      private router: Router
    ) {
      this.themeService.initTheme();
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
              error: () => {
                // stay on current page; optionally show toast via service
              },
            });
          }
        } catch {}
      });
    }


}
