import { inject } from '@angular/core';
import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let refreshInProgress = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> {
  if (!refreshInProgress) {
    refreshInProgress = true;
    refreshTokenSubject.next(null);
    return authService.refreshAccessToken().pipe(
      switchMap((tokens: any) => {
        refreshInProgress = false;
        if (tokens && tokens.accessToken && tokens.refreshToken) {
          refreshTokenSubject.next(tokens.accessToken);
          authService['storageService'].set('access-token', tokens.accessToken);
          authService['storageService'].set('refresh-token', tokens.refreshToken);
          
          const headers: Record<string, string> = {};
          if (tokens.accessToken) headers['Authorization'] = `Bearer ${tokens.accessToken}`;
          if (tokens.refreshToken) headers['refresh-token'] = tokens.refreshToken;
          
          const retryReq = request.clone({ setHeaders: headers });
          return next(retryReq);
        } else {
          authService.logout();
          return throwError(() => new Error('Invalid token refresh response'));
        }
      }),
      catchError((err) => {
        refreshInProgress = false;
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter((token) => token != null),
      take(1),
      switchMap((token) => {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) headers['refresh-token'] = refreshToken;
        const retryReq = request.clone({ setHeaders: headers });
        return next(retryReq);
      })
    );
  }
}

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  const url = request.url || '';
  const isAsset =
    url.includes('/assets/') ||
    url.startsWith('/assets') ||
    url.startsWith('assets/') ||
    url.startsWith('./assets') ||
    /^https?:\/\/[^\s]+\/assets\//.test(url) ||
    /\.(json|png|jpg|jpeg|gif|svg|webp|css|js|map|woff2?|ttf)(\?|$)/i.test(url);

  if (
    url.includes('/login') ||
    url.includes('/signup') ||
    url.includes('/refresh-token') ||
    isAsset
  ) {
    return next(request);
  }

  const accessToken = authService['storageService'].get('access-token');
  const refreshToken = authService.getRefreshToken();
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (refreshToken) headers['refresh-token'] = refreshToken;
  
  const authReq = request.clone({ setHeaders: headers });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const hasRefresh = !!authService.getRefreshToken();
      if (
        error.status === 401 &&
        hasRefresh &&
        !authReq.url.endsWith('/refresh-token')
      ) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};
