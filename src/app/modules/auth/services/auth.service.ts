import {
  HttpClient,
  HttpErrorResponse,
  HttpBackend,
} from '@angular/common/http';
import { Injectable, inject, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Observable, throwError, BehaviorSubject, from, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthResponse, User } from '../models';
import { ApiService } from 'src/app/core/services';
import { ProfileService } from 'src/app/modules/profile/services/profile.service';
import { StorageService } from './storage.service';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private apiService = inject(ApiService);
  private storageService = inject(StorageService);
  private zone = inject(NgZone);
  private profileService = inject(ProfileService);
  private tokenService = inject(TokenService);
  // Raw backend to create HttpClient that bypasses interceptors when needed
  private httpBackend = inject(HttpBackend);

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  // Store the URL to redirect to after login
  public redirectUrl: string | null = null;

  // Getter for current user state
  get isLoggedIn(): boolean {
    // Token is stored securely via TokenService
    return !!this.tokenService.getAccessToken();
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
    const user =
      (this.storageService.get('user') as User | null) ??
      this.tokenService.getUser();
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
    const left =
      window.screenX + Math.max(0, (window.outerWidth - popupWidth) / 2);
    const top =
      window.screenY + Math.max(0, (window.outerHeight - popupHeight) / 2.5);

    const features = [
      `width=${popupWidth}`,
      `height=${popupHeight}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
    ].join(',');

    const popup = window.open(authUrl, 'google_oauth', features);

    return from(
      new Promise<void>((resolve, reject) => {
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
              const { user, tokens } = data.payload as {
                user: User;
                tokens: { accessToken: string; refreshToken: string };
              };

              // Store tokens (secure) and user data
              if (tokens?.accessToken) {
                this.tokenService.setAccessToken(tokens.accessToken);
              }
              if (tokens?.refreshToken) {
                this.tokenService.setRefreshToken(tokens.refreshToken);
              }
              if (user && user._id) {
                this.tokenService.setUserId(user._id);
              }
              this.storageService.set('user', user);
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
              try {
                popup.close();
              } catch {}
            }
          }
        };

        window.addEventListener('message', onMessage);
      })
    ).pipe(catchError(this.handleError));
  }

  loginWithFacebook(): Observable<void> {
    // Popup-based OAuth: open backend Facebook route, listen for postMessage
    const authUrl = `${environment.apiUrl}/user/facebook`;
    const authOrigin = new URL(environment.apiUrl).origin;

    const popupWidth = 500;
    const popupHeight = 600;
    const left =
      window.screenX + Math.max(0, (window.outerWidth - popupWidth) / 2);
    const top =
      window.screenY + Math.max(0, (window.outerHeight - popupHeight) / 2.5);

    const features = [
      `width=${popupWidth}`,
      `height=${popupHeight}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
    ].join(',');

    const popup = window.open(authUrl, 'facebook_oauth', features);

    return from(
      new Promise<void>((resolve, reject) => {
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
              const { user, tokens } = data.payload as {
                user: User;
                tokens: { accessToken: string; refreshToken: string };
              };

              if (tokens?.accessToken) {
                this.tokenService.setAccessToken(tokens.accessToken);
              }
              if (tokens?.refreshToken) {
                this.tokenService.setRefreshToken(tokens.refreshToken);
              }
              if (user && user._id) {
                this.tokenService.setUserId(user._id);
              }
              this.storageService.set('user', user);
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
              try {
                popup.close();
              } catch {}
            }
          }
        };

        window.addEventListener('message', onMessage);
      })
    ).pipe(catchError(this.handleError));
  }

  private authenticate(
    url: string,
    credentials: Record<string, any>
  ): Observable<AuthResponse> {
    const fullUrl = `${environment.apiUrl}${url}`;

    // On native (Android/iOS), prefer Capacitor HTTP plugin to bypass WebView CORS
    if (Capacitor.isNativePlatform()) {
      const Http = (window as any)?.Capacitor?.Plugins?.Http;
      if (Http && typeof Http.post === 'function') {
        return from(
          Http.post({
            url: fullUrl,
            headers: { 'Content-Type': 'application/json' },
            data: credentials,
          })
        ).pipe(
          map((resp: any) => {
            // Plugin returns { status, data, headers, url }
            const response = resp?.data;
            if (!response?.data?.user) {
              const message = response?.error?.message || 'Invalid credentials';
              throw new HttpErrorResponse({
                status: 401,
                statusText: 'Unauthorized',
                error: { message },
              });
            }

            const user = response.data.user as AuthResponse['data']['user'];
            const accessTokenNormalized =
              response?.data?.tokens?.accessToken ??
              response?.data?.accessToken ??
              response?.data?.token ??
              '';
            const refreshTokenNormalized =
              response?.data?.tokens?.refreshToken ??
              response?.data?.refreshToken ??
              '';
            const tokens = {
              accessToken: accessTokenNormalized,
              refreshToken: refreshTokenNormalized,
            } as NonNullable<AuthResponse['data']['tokens']>;

            if (tokens?.accessToken) this.tokenService.setAccessToken(tokens.accessToken);
            if (tokens?.refreshToken) this.tokenService.setRefreshToken(tokens.refreshToken);
            if (user && user._id) this.tokenService.setUserId(user._id);
            this.storageService.set('user', user);
            this.userSubject.next(user);

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
      // If plugin not available, fall back to web path below (may hit CORS on native)
    }

    // Web: Use a bare HttpClient (bypasses interceptors and ApiService error wrapping)
    const http = new HttpClient(this.httpBackend);
    return http.post<any>(fullUrl, credentials).pipe(
      map((response) => {
        // Some backends may return { success: false, error: { message } } with 200
        if (!response?.data?.user) {
          const message = response?.error?.message || 'Invalid credentials';
          throw new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: { message },
          });
        }

        const user = response.data.user as AuthResponse['data']['user'];
        // Normalize tokens from different backend shapes
        const accessTokenNormalized =
          response?.data?.tokens?.accessToken ??
          response?.data?.accessToken ??
          response?.data?.token ??
          '';
        const refreshTokenNormalized =
          response?.data?.tokens?.refreshToken ??
          response?.data?.refreshToken ??
          '';
        const tokens = {
          accessToken: accessTokenNormalized,
          refreshToken: refreshTokenNormalized,
        } as NonNullable<AuthResponse['data']['tokens']>;

        // Store tokens (secure) and user data
        if (tokens?.accessToken) {
          this.tokenService.setAccessToken(tokens.accessToken);
        }
        if (tokens?.refreshToken) {
          this.tokenService.setRefreshToken(tokens.refreshToken);
        }
        if (user && user._id) {
          this.tokenService.setUserId(user._id);
        }
        this.storageService.set('user', user);
        this.userSubject.next(user);

        // Navigate to redirect URL or home
        const redirectUrl = this.redirectUrl || '/home';
        this.redirectUrl = null;
        this.zone.run(() => {
          this.router.navigateByUrl(redirectUrl);
        });

        return response as AuthResponse;
      }),
      // Preserve original HttpErrorResponse so components can display messages
      catchError(this.handleError)
    );
  }

  logout(): Observable<void> {
    // Clear all auth-related data
    this.tokenService.removeSession();
    this.storageService.clear();
    // Also clear cached profile stored outside StorageService prefixing
    this.profileService.clearProfile();
    // Update state
    this.userSubject.next(null);
    this.redirectUrl = null;
    // Avoid Angular/Ionic navigation to prevent StackController transition errors
    // Perform a single hard redirect which resets history and view stack
    try {
      location.replace('/home');
    } catch {
      // Fallback
      (window as any).location.href = '/home';
    }
    return of(undefined);
  }

  /**
   * Calls the backend to refresh the access token using the stored refresh token.
   * Returns an object: { accessToken, refreshToken }
   */
  refreshAccessToken(): Observable<{
    accessToken: string;
    refreshToken: string;
  }> {
    const refreshToken = this.getRefreshToken();
    // Use a bare HttpClient that bypasses interceptors to avoid cycles
    const http = new HttpClient(this.httpBackend);
    return http
      .post<any>(`${environment.apiUrl}/user/refresh-token`, { refreshToken })
      .pipe(
        map((response) => {
          // Response: { accessToken, refreshToken }
          if (response && response.accessToken && response.refreshToken) {
            // Store new tokens
            this.tokenService.setAccessToken(response.accessToken);
            this.tokenService.setRefreshToken(response.refreshToken);
            return {
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
            };
          } else {
            this.logout();
            throw new Error('Invalid token refresh response');
          }
        }),
        catchError((err) => {
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
    return this.tokenService.getRefreshToken();
  }

  getUserId(): string | null {
    return this.currentUser?._id || null;
  }
}
