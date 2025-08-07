import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
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
  private apiService = inject(ApiService);
  private storageService = inject(StorageService);
  private zone = inject(NgZone);

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  
  // Store the URL to redirect to after login
  public redirectUrl: string | null = null;

  // Getter for current user state
  get isLoggedIn(): boolean {
    return !!this.storageService.get('access_token');
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

  loginWithGoogle(): Observable<AuthResponse> {
    return this.authenticate(`/user/google`, {});
  }

  private authenticate(url: string, credentials: Record<string, any>): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>(url, credentials).pipe(
      tap((response) => {
        if (response?.data?.user) {
          const user = response.data.user;
          const tokens = response.data.tokens || {
            accessToken: response.data.token || '',
            refreshToken: response.data.refreshToken || ''
          };
          
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
          // Run navigation inside Angular's zone to ensure change detection is triggered
          this.zone.run(() => {
            this.router.navigateByUrl(redirectUrl);
          });
        }
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
    // Run navigation inside Angular's zone to ensure change detection is triggered
    this.zone.run(() => {
      this.router.navigate(['/login']);
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

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message;
    }
    return throwError(() => new Error(errorMessage));
  }

  getRefreshToken(): string | null {
    return this.storageService.get('refresh-token');
  }

  getUserId(): string | null {
    return this.currentUser?._id || null;
  }
}