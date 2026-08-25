import {
  HttpClient,
  HttpErrorResponse,
  HttpBackend,
} from '@angular/common/http';
import { Injectable, inject, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Observable, throwError, from, of, EMPTY } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from 'src/environments/environment';
import { AuthResponse, User } from '../models';
import { ApiService } from 'src/app/core/services';
import { ProfileService } from 'src/app/modules/profile/services/profile.service';
import { StorageService } from './storage.service';
import { TokenService } from './token.service';
import { EncryptionService } from 'src/app/core/services/encryption.service';

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
  private encryptionService = inject(EncryptionService);
  // Raw backend to create HttpClient that bypasses interceptors when needed
  private httpBackend = inject(HttpBackend);

  public user = this.tokenService.user;
  public user$ = toObservable(this.user);

  public isLoggedIn$: Observable<boolean> = this.user$.pipe(
    map((user) => !!user)
  );

  // Store the URL to redirect to after login
  public redirectUrl: string | null = null;

  // Getter for current user state
  get isLoggedIn(): boolean {
    // Check both token and user data to ensure complete authentication state
    const hasToken = !!this.tokenService.getAccessToken();
    const hasUser = !!this.user();
    
    // If we have a token but no user, try to restore user from storage
    if (hasToken && !hasUser) {
      const storedUser = this.tokenService.getUser();
      if (storedUser) {
        this.tokenService.setUser(storedUser);
        return true;
      }
      // Token exists but no user data - invalid state
      return false;
    }
    
    return hasToken && hasUser;
  }

  // Alias for current user
  get currentUser(): User | null {
    return this.user();
  }

  // Observable of user changes
  get userChanges(): Observable<User | null> {
    return this.user$;
  }

  constructor() {
    this.initializeUser();
  }

  /**
   * Gets the current user's ID if available
   * @returns The current user's ID or null if not authenticated
   */
  getCurrentUserId(): string | null {
    return this.user()?._id || null;
  }

  private initializeUser(): void {
    const user =
      (this.storageService.get('user') as User | null) ??
      this.tokenService.getUser();
    if (user) {
      this.tokenService.setUser(user);
    }
  }

  // Authentication methods
  login(email: string, password: string): Observable<AuthResponse> {
    return this.authenticate(`/user/login`, { email, password });
  }

  signup(email: string, password: string): Observable<AuthResponse> {
    return this.authenticate(`/user/signup`, { email, password });
  }

  /**
   * Google Sign-In with platform detection:
   * - Native (Android/iOS): Uses Capacitor GoogleAuth plugin
   * - Web: Redirects to backend OAuth flow, returns to /auth/callback
   */
  loginWithGoogle(): Observable<void> {
    const platform = Capacitor.getPlatform?.() || 'web';
    const hasGoogleAuthPlugin = !!(
      (window as any)?.Capacitor?.Plugins?.GoogleAuth ||
      (window as any)?.GoogleAuth
    );
    
    const isNative = (platform === 'android' || platform === 'ios') && hasGoogleAuthPlugin;
    
    if (isNative) {
      return from(
        (async () => {
          const GA =
            (window as any)?.Capacitor?.Plugins?.GoogleAuth ||
            (window as any)?.GoogleAuth;
          
          if (!GA) {
            throw new Error('GoogleAuth plugin not available');
          }

          try {
            // Initialize if needed
            if (typeof GA.initialize === 'function' && environment.google?.webClientId) {
              try {
                await GA.initialize({
                  clientId: environment.google.webClientId,
                  scopes: ['profile', 'email'],
                  grantOfflineAccess: true,
                });
              } catch (initError) {
                console.warn('[AuthService] GoogleAuth init warning:', initError);
              }
            }

            const res = await GA.signIn();
            const idToken: string = res?.authentication?.idToken || res?.idToken || '';
            
            if (!idToken) {
              throw new Error('Failed to obtain Google idToken');
            }

            await this.authenticate(`/user/auth/google/native`, { idToken }).toPromise();
            return;
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            throw new Error(`Google Sign-In failed: ${errorMessage}`);
          }
        })()
      ).pipe(
        map(() => undefined),
        catchError((error) => {
          let errorMessage = 'Network error occurred during Google Sign-In';
          if (error?.status) errorMessage += ` (HTTP ${error.status})`;
          if (error?.message) errorMessage += `: ${error.message}`;
          return throwError(() => new Error(errorMessage));
        })
      );
    }

    // Web: Redirect to backend OAuth (will redirect back to /auth/callback)
    const authUrl = `${environment.apiUrl}/user/google`;
    window.location.href = authUrl;
    return EMPTY;
  }


  private authenticate(
    url: string,
    credentials: Record<string, any>
  ): Observable<AuthResponse> {
    const fullUrl = `${environment.apiUrl}${url}`;

    // Encrypt credentials only if encryption is enabled
    const payload = environment.enableEncryption
      ? { data: this.encryptionService.encrypt(credentials) }
      : credentials;

    // On native (Android/iOS), prefer Capacitor HTTP plugin to bypass WebView CORS
    if (Capacitor.isNativePlatform()) {
      const Http = (window as any)?.Capacitor?.Plugins?.Http;
      if (Http && typeof Http.post === 'function') {
        return from(
          Http.post({
            url: fullUrl,
            headers: { 'Content-Type': 'application/json' },
            data: payload,
          })
        ).pipe(
          map((resp: any) => {
            // Plugin returns { status, data, headers, url }
            let response = resp?.data;

            // Decrypt response if needed
            if (
              response &&
              response.data &&
              typeof response.data === 'string'
            ) {
              const decrypted = this.encryptionService.decrypt(response.data);
              if (decrypted) {
                response = decrypted;
              }
            }

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

            if (tokens?.accessToken)
              this.tokenService.setAccessToken(tokens.accessToken);
            if (tokens?.refreshToken)
              this.tokenService.setRefreshToken(tokens.refreshToken);
            if (user && user._id) this.tokenService.setUserId(user._id);
            this.storageService.set('user', user);
            this.tokenService.setUser(user);

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
    return http.post<any>(fullUrl, payload).pipe(
      map((res) => {
        let response = res;
        // Decrypt response if needed
        if (response && response.data && typeof response.data === 'string') {
          const decrypted = this.encryptionService.decrypt(response.data);
          if (decrypted) {
            response = decrypted;
          }
        }

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
        this.tokenService.setUser(user);

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

    const encryptedBody = {
      data: this.encryptionService.encrypt({ refreshToken }),
    };

    return http
      .post<any>(`${environment.apiUrl}/user/refresh-token`, encryptedBody)
      .pipe(
        map((res) => {
          let response = res;
          // Decrypt response if needed
          if (response && response.data && typeof response.data === 'string') {
            const decrypted = this.encryptionService.decrypt(response.data);
            if (decrypted) {
              response = decrypted;
            }
          }

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

  /**
   * Handle OAuth payload delivered via mobile deep link (base64-encoded JSON in URL hash)
   * @param payloadB64 base64 string of JSON: { user, tokens: { accessToken, refreshToken } }
   */
  handleOAuthDeepLink(payloadB64: string): Observable<void> {
    try {
      const json = atob(payloadB64);
      const parsed = JSON.parse(json);
      return this.handleOAuthCallback(parsed);
    } catch (e) {
      return throwError(() => e);
    }
  }

  /**
   * Handle OAuth callback payload (already parsed)
   * @param payload { user, tokens: { accessToken, refreshToken } }
   */
  handleOAuthCallback(payload: any): Observable<void> {
    try {
      const user = payload?.user as User | undefined;
      const accessToken =
        payload?.tokens?.accessToken || payload?.accessToken || payload?.token;
      const refreshToken = payload?.tokens?.refreshToken || payload?.refreshToken;
      if (!user || !accessToken || !refreshToken) {
        return throwError(() => new Error('Invalid OAuth payload'));
      }

      // Persist tokens & user
      this.tokenService.setAccessToken(accessToken);
      this.tokenService.setRefreshToken(refreshToken);
      if (user && (user as any)._id) {
        this.tokenService.setUserId((user as any)._id);
      }
      this.storageService.set('user', user);
      this.tokenService.setUser(user);
      return of(undefined);
    } catch (e) {
      return throwError(() => e);
    }
  }
}
