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

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
}

/**
 * Enhanced in-memory cache for GET requests with TTL support.
 * 
 * Features:
 * - Caches GET requests only
 * - TTL (Time To Live): 5 minutes default
 * - Automatic cleanup of expired entries
 * - Cache size limit
 */
@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_CACHE_SIZE = 50; // Maximum cached entries
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Cleanup expired entries every minute
    setInterval(() => this.cleanupExpired(), 60000);
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // Check if we have a valid cached response
    const cached = this.cache.get(req.urlWithParams);
    if (cached && !this.isExpired(cached)) {
      console.log('✅ [Cache] HIT:', req.urlWithParams);
      return of(cached.response.clone());
    }

    // If expired or not cached, remove old entry
    if (cached) {
      this.cache.delete(req.urlWithParams);
    }

    // Forward request and cache response
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          // Enforce cache size limit
          if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
          }

          this.cache.set(req.urlWithParams, {
            response: event.clone(),
            timestamp: Date.now(),
          });
          console.log('💾 [Cache] STORED:', req.urlWithParams);
        }
      })
    );
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.CACHE_TTL;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 [Cache] Cleaned ${cleaned} expired entries`);
    }
  }
}
