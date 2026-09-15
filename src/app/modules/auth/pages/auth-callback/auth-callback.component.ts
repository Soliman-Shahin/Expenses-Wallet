import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: var(--ion-background-color, #fff);">
      <div style="text-align: center;">
        <div style="border: 4px solid var(--ion-color-light, #f3f3f3); 
                    border-top: 4px solid var(--ion-color-primary, #3498db); 
                    border-radius: 50%; width: 50px; height: 50px; 
                    animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p style="color: var(--ion-text-color, #000); font-size: 16px; margin: 0;">Completing sign in...</p>
      </div>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `,
  standalone: true
})
export class AuthCallbackComponent implements OnInit {
  private completed = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      const data = this.readCallbackData(params['data']);
      if (data) {
        try {
          const payload = JSON.parse(atob(data));
          
          this.authService.handleOAuthCallback(payload).subscribe({
            next: () => {
              this.completed = true;
              void this.router.navigateByUrl('/home', { replaceUrl: true });
            },
            error: () => {
              this.fail('auth_failed');
            }
          });
        } catch (e) {
          this.fail('invalid_data');
        }
      } else {
        this.fail('auth_failed');
      }
    });
  }

  private readCallbackData(queryData: unknown): string | null {
    if (typeof queryData === 'string' && queryData) return queryData;
    const searchData = new URLSearchParams(window.location.search).get('data');
    if (searchData) return searchData;
    const marker = '/auth/callbackdata=';
    const index = window.location.href.indexOf(marker);
    return index >= 0 ? window.location.href.slice(index + marker.length) : null;
  }

  private fail(error: string): void {
    if (this.completed) return;
    this.completed = true;
    void this.router.navigate(['/auth/login'], { queryParams: { error }, replaceUrl: true });
  }
}
