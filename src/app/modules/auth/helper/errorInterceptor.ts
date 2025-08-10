import { HttpHandler, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService
  ) {}

  intercept(req: any, next: HttpHandler): Observable<any> {
    // Bypass static assets (e.g., translations, images, fonts)
    const url: string = req?.url || '';
    const isAssetRequest =
      url.includes('/assets/') ||
      url.startsWith('/assets') ||
      url.startsWith('assets/') ||
      url.startsWith('./assets') ||
      /^https?:\/\/[^\s]+\/assets\//.test(url) ||
      /\.(json|png|jpg|jpeg|gif|svg|webp|css|js|map|woff2?|ttf)(\?|$)/i.test(url);
    if (isAssetRequest) {
      return next.handle(req);
    }

    // pass the request to the next handler and catch any errors
    return next.handle(req).pipe(
      catchError((error) => {
        // Do NOT refresh here to avoid loops; AuthInterceptor handles 401/refresh.
        // If we still get 401 here, refresh has failed -> logout.
        if (error?.status === 401) {
          this.authService.logout();
          return throwError(() => error);
        } else {
          // otherwise, throw the error as usual
          return throwError(error);
        }
      })
    );
  }
}
