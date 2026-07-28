import { inject } from '@angular/core';
import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const tokenService = inject(TokenService);

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
    url.includes('/google') ||
    url.includes('/health') ||
    isAsset
  ) {
    return next(request);
  }

  const accessToken = tokenService.getAccessToken();
  const refreshToken = tokenService.getRefreshToken();
  
  // Only add headers if we have tokens
  if (!accessToken) {
    return next(request);
  }
  
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (refreshToken) headers['refresh-token'] = refreshToken;
  
  const authReq = request.clone({ setHeaders: headers });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't try to handle 401 here - let errorInterceptor handle it
      // This prevents circular dependency issues
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
