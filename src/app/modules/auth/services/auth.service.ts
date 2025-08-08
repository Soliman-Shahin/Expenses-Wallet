import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Observable, throwError, BehaviorSubject, from, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User } from '../models';
import { ApiService } from 'src/app/core/services';
import { StorageService } from './storage.service';

interface AuthResponse {
  data: {
    user: User;
    tokens?: {
      accessToken: string;
      refreshToken: string;
    };
    token?: string;
    refreshToken?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private apiService = inject(ApiService);
  private storageService = inject(StorageService);
  private zone = inject(NgZone);

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  
  // Store the URL to redirect to after login
  public redirectUrl: string | null = null;

  // Getter for current user state
  get isLoggedIn(): boolean {
    // Use consistent key name 'access-token'
    return !!this.storageService.get('access-token');
  }

  // Alias for current user
  get currentUser(): User | null {
    return this.userSubject.value;
  }

  // Observable of user changes
  get userChanges(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  constructor() {
    this.initializeUser();
  }

  /**
   * Gets the current user's ID if available
   * @returns The current user's ID or null if not authenticated
   */
  getCurrentUserId(): string | null {
    return this.userSubject.value?._id || null;
  }

  private initializeUser(): void {
    const user = this.storageService.get('user') as User | null;
    if (user) {
      this.userSubject.next(user);
    }
  }

  // Authentication methods
  login(email: string, password: string): Observable<AuthResponse> {
    return this.authenticate(`/user/login`, { email, password });
  }

  signup(email: string, password: string): Observable<AuthResponse> {
    return this.authenticate(`/user/signup`, { email, password });
  }

  loginWithGoogle(): Observable<void> {
    // Popup-based OAuth: open backend Google route, listen for postMessage
    const authUrl = `${environment.apiUrl}/user/google`;
    const authOrigin = new URL(environment.apiUrl).origin;

    const popupWidth = 500;
    const popupHeight = 600;
    const left = window.screenX + Math.max(0, (window.outerWidth - popupWidth) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - popupHeight) / 2.5);

    const features = [
      `width=${popupWidth}`,
      `height=${popupHeight}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
    ].join(',');

    const popup = window.open(authUrl, 'google_oauth', features);

    return from(new Promise<void>((resolve, reject) => {
      if (!popup) {
        reject(new Error('Unable to open authentication window'));
        return;
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
        }
      }, 500);

      const onMessage = (event: MessageEvent) => {
        // Ensure message is from backend origin (or allow any during local dev)
        const isFromBackend = event.origin === authOrigin;
        if (!isFromBackend) {
          return;
        }
        const data = event.data || {};
        if (data && data.type === 'google-auth-success' && data.payload) {
          window.removeEventListener('message', onMessage);
          try {
            const { user, tokens } = data.payload as { user: User; tokens: { accessToken: string; refreshToken: string } };

            // Store tokens and user data
            if (tokens?.accessToken) {
              this.storageService.set('access-token', tokens.accessToken);
            }
            if (tokens?.refreshToken) {
              this.storageService.set('refresh-token', tokens.refreshToken);
            }
            this.storageService.set('user', user);
            this.storageService.set('user-id', user._id);
            this.userSubject.next(user);

            // Navigate after login inside Angular zone
            const redirectUrl = this.redirectUrl || '/home';
            this.redirectUrl = null;
            this.zone.run(() => {
              this.router.navigateByUrl(redirectUrl);
            });

            resolve();
          } catch (e) {
            reject(e);
          } finally {
            try { popup.close(); } catch {}
          }
        }
      };

      window.addEventListener('message', onMessage);
    })).pipe(catchError(this.handleError));
  }

  loginWithFacebook(): Observable<void> {
    // Popup-based OAuth: open backend Facebook route, listen for postMessage
    const authUrl = `${environment.apiUrl}/user/facebook`;
    const authOrigin = new URL(environment.apiUrl).origin;

    const popupWidth = 500;
    const popupHeight = 600;
    const left = window.screenX + Math.max(0, (window.outerWidth - popupWidth) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - popupHeight) / 2.5);

    const features = [
      `width=${popupWidth}`,
      `height=${popupHeight}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
    ].join(',');

    const popup = window.open(authUrl, 'facebook_oauth', features);

    return from(new Promise<void>((resolve, reject) => {
      if (!popup) {
        reject(new Error('Unable to open authentication window'));
        return;
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
        }
      }, 500);

      const onMessage = (event: MessageEvent) => {
        const isFromBackend = event.origin === authOrigin;
        if (!isFromBackend) {
          return;
        }
        const data = event.data || {};
        if (data && data.type === 'facebook-auth-success' && data.payload) {
          window.removeEventListener('message', onMessage);
          try {
            const { user, tokens } = data.payload as { user: User; tokens: { accessToken: string; refreshToken: string } };

            if (tokens?.accessToken) {
              this.storageService.set('access-token', tokens.accessToken);
            }
            if (tokens?.refreshToken) {
              this.storageService.set('refresh-token', tokens.refreshToken);
            }
            this.storageService.set('user', user);
            this.storageService.set('user-id', user._id);
            this.userSubject.next(user);

            const redirectUrl = this.redirectUrl || '/home';
            this.redirectUrl = null;
            this.zone.run(() => {
              this.router.navigateByUrl(redirectUrl);
            });

            resolve();
          } catch (e) {
            reject(e);
          } finally {
            try { popup.close(); } catch {}
          }
        }
      };

      window.addEventListener('message', onMessage);
    })).pipe(catchError(this.handleError));
  }

  private authenticate(url: string, credentials: Record<string, any>): Observable<AuthResponse> {
    return this.apiService.post<any>(url, credentials).pipe(
      map((response) => {
        // Some backends may return { success: false, error: { message } } with 200
        if (!response?.data?.user) {
          const message = response?.error?.message || 'Invalid credentials';
          throw new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', error: { message } });
        }

        const user = response.data.user as AuthResponse['data']['user'];
        const tokens = (response.data.tokens ?? {
          accessToken: response.data.token || '',
          refreshToken: response.data.refreshToken || '',
        }) as NonNullable<AuthResponse['data']['tokens']>;

        // Store tokens and user data
        if (tokens.accessToken) {
          this.storageService.set('access-token', tokens.accessToken);
        }
        if (tokens.refreshToken) {
          this.storageService.set('refresh-token', tokens.refreshToken);
        }
        this.storageService.set('user', user);
        this.storageService.set('user-id', user._id);
        this.userSubject.next(user);

        // Navigate to redirect URL or home
        const redirectUrl = this.redirectUrl || '/home';
        this.redirectUrl = null;
        this.zone.run(() => {
          this.router.navigateByUrl(redirectUrl);
        });

        return response as AuthResponse;
      }),
      catchError(this.handleError)
    );
  }

  logout(): Observable<void> {
    // Clear all auth-related data
    this.storageService.remove('access-token');
    this.storageService.remove('refresh-token');
    this.storageService.remove('user');
    this.storageService.remove('user-id');
    this.storageService.clear();
    // Update state
    this.userSubject.next(null);
    this.redirectUrl = null;
    // Run navigation inside Angular's zone to ensure change detection is triggered
    this.zone.run(() => {
      // Reset navigation stack to avoid back navigation into protected pages
      this.navCtrl.navigateRoot(['/login']);
    });
    return of(undefined);
  }

  /**
   * Calls the backend to refresh the access token using the stored refresh token.
   * Returns an object: { accessToken, refreshToken }
   */
  refreshAccessToken(): Observable<{ accessToken: string, refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.apiService.post<any>(`/user/refresh-token`, { refreshToken }).pipe(
      map(response => {
        // Response: { accessToken, refreshToken }
        if (response && response.accessToken && response.refreshToken) {
          // Store new tokens
          this.storageService.set('access-token', response.accessToken);
          this.storageService.set('refresh-token', response.refreshToken);
          return {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken
          };
        } else {
          this.logout();
          throw new Error('Invalid token refresh response');
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  // Error handling: rethrow original HttpErrorResponse to keep status/body
  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error);
  }

  getRefreshToken(): string | null {
    return this.storageService.get('refresh-token');
  }

  getUserId(): string | null {
    return this.currentUser?._id || null;
  }
}