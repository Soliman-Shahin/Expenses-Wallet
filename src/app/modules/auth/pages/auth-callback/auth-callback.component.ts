import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const data = params['data'];
      if (data) {
        try {
          const payload = JSON.parse(atob(decodeURIComponent(data)));
          
          this.authService.handleOAuthCallback(payload).subscribe({
            next: () => {
              this.router.navigateByUrl('/home');
            },
            error: () => {
              this.router.navigateByUrl('/auth/login?error=auth_failed');
            }
          });
        } catch (e) {
          this.router.navigateByUrl('/auth/login?error=invalid_data');
        }
      } else {
        this.router.navigateByUrl('/auth/login');
      }
    });
  }
}
