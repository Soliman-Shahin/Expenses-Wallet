import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, retryWhen, mergeMap, finalize } from 'rxjs/operators';

/**
 * Retry Interceptor
 * Automatically retries failed requests with exponential backoff
 *
 * Features:
 * - Configurable max retries
 * - Exponential backoff delay
 * - Skip retry for certain status codes (4xx client errors)
 * - Retry only specific methods (GET by default)
 */
@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  private readonly MAX_RETRIES = 1; // Reduced from 3 to 1
  private readonly INITIAL_DELAY = 1000; // 1 second
  private readonly MAX_DELAY = 3000; // Reduced from 10s to 3s

  // HTTP methods that are safe to retry
  private readonly RETRYABLE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

  // Status codes that should NOT be retried
  private readonly NON_RETRYABLE_STATUS = [
    400, // Bad Request
    401, // Unauthorized
    403, // Forbidden
    404, // Not Found
    422, // Validation Error
    423, // Locked (brute force)
    429, // Rate Limit (should wait for Retry-After header)
  ];

  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Only retry safe methods
    if (!this.isRetryable(request)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, attempt) => {
            // Check if we should retry this error
            if (!this.shouldRetry(error, attempt)) {
              return throwError(() => error);
            }

            // Calculate delay with exponential backoff
            const delay = this.calculateDelay(attempt);

            console.warn(
              `🔄 Retrying request (attempt ${attempt + 1}/${
                this.MAX_RETRIES
              }) after ${delay}ms:`,
              request.url
            );

            // Wait before retrying
            return timer(delay);
          })
        )
      ),
      finalize(() => {
        // Cleanup - request completed
      })
    );
  }

  /**
   * Check if request is retryable based on HTTP method
   */
  private isRetryable(request: HttpRequest<unknown>): boolean {
    return this.RETRYABLE_METHODS.includes(request.method.toUpperCase());
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: any, attempt: number): boolean {
    // Don't retry if max retries exceeded
    if (attempt >= this.MAX_RETRIES) {
      console.log('❌ Max retries exceeded');
      return false;
    }

    // Don't retry if it's not an HTTP error
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    // Don't retry client errors (4xx) except network errors
    if (
      error.status !== 0 &&
      this.NON_RETRYABLE_STATUS.includes(error.status)
    ) {
      console.log(`❌ Not retrying status ${error.status}`);
      return false;
    }

    // Only retry server errors (5xx), NOT network errors (status 0)
    // This prevents infinite retry loop when backend is down
    const shouldRetry = error.status >= 500 && error.status < 600;

    if (!shouldRetry && error.status === 0) {
      console.log('❌ Backend not available - not retrying network error');
      return false;
    }

    if (shouldRetry) {
      console.log(`✅ Will retry server error: ${error.status} ${error.statusText}`);
    }

    return shouldRetry;
  }

  /**
   * Calculate delay with exponential backoff
   * Formula: delay = initialDelay * (2 ^ attempt)
   * Example: 1s, 2s, 4s, 8s, ...
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.INITIAL_DELAY * Math.pow(2, attempt);
    const delay = Math.min(exponentialDelay, this.MAX_DELAY);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;

    return Math.floor(delay + jitter);
  }
}
