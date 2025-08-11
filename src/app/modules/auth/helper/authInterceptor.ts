import {
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshInProgress = false;
  private refreshTokenSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Skip adding headers for login/signup/refresh endpoints and static assets
    const url = request.url || '';
    const isAsset =
      url.includes('/assets/') ||
      url.startsWith('/assets') ||
      url.startsWith('assets/') ||
      url.startsWith('./assets') ||
      // absolute URL case
      /^https?:\/\/[^\s]+\/assets\//.test(url) ||
      // common static extensions
      /\.(json|png|jpg|jpeg|gif|svg|webp|css|js|map|woff2?|ttf)(\?|$)/i.test(
        url
      );
    if (
      url.includes('/login') ||
      url.includes('/signup') ||
      url.includes('/refresh-token') ||
      isAsset
    ) {
      return next.handle(request);
    }

    const accessToken = this.authService['storageService'].get('access-token');
    const refreshToken = this.authService.getRefreshToken();
    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    if (refreshToken) headers['refresh-token'] = refreshToken;
    const authReq = request.clone({ setHeaders: headers });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only attempt refresh if we actually have a refresh token
        const hasRefresh = !!this.authService.getRefreshToken();
        if (
          error.status === 401 &&
          hasRefresh &&
          !authReq.url.endsWith('/refresh-token')
        ) {
          return this.handle401Error(authReq, next);
        }
        // Otherwise, propagate the error so the UI can show proper messages
        return throwError(() => error);
      })
    );
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.refreshInProgress) {
      this.refreshInProgress = true;
      this.refreshTokenSubject.next(null);
      return this.authService.refreshAccessToken().pipe(
        switchMap((tokens: any) => {
          this.refreshInProgress = false;
          if (tokens && tokens.accessToken && tokens.refreshToken) {
            this.refreshTokenSubject.next(tokens.accessToken);
            // Update storage with new tokens
            this.authService['storageService'].set(
              'access-token',
              tokens.accessToken
            );
            this.authService['storageService'].set(
              'refresh-token',
              tokens.refreshToken
            );
            // Retry original request
            const headers: Record<string, string> = {};
            if (tokens.accessToken)
              headers['Authorization'] = `Bearer ${tokens.accessToken}`;
            if (tokens.refreshToken)
              headers['refresh-token'] = tokens.refreshToken;
            // no custom _id header; JWT carries subject
            // Always update tokens in storage before retry
            this.authService['storageService'].set(
              'access-token',
              tokens.accessToken
            );
            this.authService['storageService'].set(
              'refresh-token',
              tokens.refreshToken
            );
            const retryReq = request.clone({ setHeaders: headers });
            return next.handle(retryReq);
          } else {
            this.authService.logout();
            return throwError(
              () => new Error('Invalid token refresh response')
            );
          }
        }),
        catchError((err) => {
          this.refreshInProgress = false;
          // Do not force redirect to home on refresh failure; let caller handle
          // Surface the error to the UI (e.g., to show login error message)
          return throwError(() => err);
        })
      );
    } else {
      // Wait until refresh is done, then retry
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => {
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const refreshToken = this.authService.getRefreshToken();
          if (refreshToken) headers['refresh-token'] = refreshToken;
          // no custom _id header; JWT carries subject
          const retryReq = request.clone({ setHeaders: headers });
          return next.handle(retryReq);
        })
      );
    }
  }
}
