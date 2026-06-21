import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
} from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap, mergeMap, map } from 'rxjs/operators';
import { EncryptionAdvancedService } from '../services/encryption-advanced.service';
import { environment } from 'src/environments/environment';

/**
 * Advanced Encryption Interceptor
 * Compatible with backend AES-256-GCM encryption
 *
 * Features:
 * - Encrypts request bodies using AES-256-GCM
 * - Decrypts response bodies
 * - Skips encryption for assets and external URLs
 * - Configurable via environment settings
 */
@Injectable()
export class EncryptionAdvancedInterceptor implements HttpInterceptor {
  private readonly SENSITIVE_FIELDS = ['id', '_id'];

  constructor(private encryptionService: EncryptionAdvancedService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Skip encryption if disabled or for specific URLs
    if (!this.shouldEncrypt(request)) {
      return next.handle(request);
    }

    // Encrypt request body if present
    if (request.body && !(request.body instanceof FormData)) {
      return from(this.encryptRequest(request)).pipe(
        switchMap((encryptedRequest) =>
          this.handleResponse(encryptedRequest, next)
        )
      );
    }

    // No body to encrypt, just handle response
    return this.handleResponse(request, next);
  }

  /**
   * Check if request should be encrypted
   */
  private shouldEncrypt(request: HttpRequest<unknown>): boolean {
    // Skip if encryption is disabled
    if (!this.encryptionService.isEncryptionEnabled()) {
      return false;
    }

    // Skip for assets
    if (request.url.includes('assets/') || request.url.includes('/i18n/')) {
      return false;
    }

    // Skip for external URLs (not our API)
    if (!request.url.startsWith(environment.apiUrl)) {
      return false;
    }

    // Skip for health check endpoints
    if (request.url.includes('/health')) {
      return false;
    }

    return true;
  }

  /**
   * Encrypt request body (Field Level)
   */
  private async encryptRequest(
    request: HttpRequest<unknown>
  ): Promise<HttpRequest<unknown>> {
    try {
      // Recursively encrypt sensitive fields
      const encryptedBody = await this.encryptionService.encryptFieldsDeep(
        request.body,
        this.SENSITIVE_FIELDS
      );

      return request.clone({
        body: encryptedBody,
      });
    } catch (error) {
      console.error('❌ Failed to encrypt request:', error);
      // Fall back to unencrypted request
      return request;
    }
  }

  /**
   * Handle response and decrypt if needed
   */
  private handleResponse(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      mergeMap((event) => {
        if (event instanceof HttpResponse && event.body) {
          return from(this.decryptResponse(event));
        }
        return of(event);
      })
    );
  }

  /**
   * Decrypt response body (Field Level)
   */
  private async decryptResponse(
    response: HttpResponse<any>
  ): Promise<HttpResponse<any>> {
    try {
      // Recursively decrypt sensitive fields
      const decryptedBody = await this.encryptionService.decryptFieldsDeep(
        response.body,
        this.SENSITIVE_FIELDS
      );

      return response.clone({
        body: decryptedBody,
      });
    } catch (error) {
      console.error('❌ Failed to decrypt response:', error);
      // Return original response if decryption fails
      return response;
    }
  }
}
