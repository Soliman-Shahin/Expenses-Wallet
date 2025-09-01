import { Component, NgZone, OnInit, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { BaseComponent } from './shared/base/base.component';
import { DirectionService } from './core/services/direction.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent extends BaseComponent implements OnInit {
  constructor(private zone: NgZone) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.themeService.initTheme();
    // Eagerly initialize the direction service to set the initial direction
    inject(DirectionService);

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


}
