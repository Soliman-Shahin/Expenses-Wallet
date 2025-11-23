import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Simple in‑memory cache for GET requests.
 * Stores the full HttpResponse keyed by the request URL with query params.
 * Cached entries are cleared when the application is refreshed (no persistence).
 */
@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<any>>();

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Only cache GET requests – other verbs should pass through.
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    const cachedResponse = this.cache.get(req.urlWithParams);
    if (cachedResponse) {
      // Return a cloned response to avoid side‑effects.
      return of(cachedResponse.clone());
    }

    // If not cached, forward the request and store the response when it arrives.
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.cache.set(req.urlWithParams, event.clone());
        }
      })
    );
  }
}
