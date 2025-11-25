import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

/**
 * Enhanced Error Interceptor
 * Handles all HTTP errors including:
 * - Rate limiting (429)
 * - Account locked (423)
 * - Authentication errors (401)
 * - Validation errors (400, 422)
 * - Server errors (500+)
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private toastController: ToastController,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.handleError(error, request);
        return throwError(() => error);
      })
    );
  }

  private async handleError(
    error: HttpErrorResponse,
    request: HttpRequest<unknown>
  ): Promise<void> {
    let errorMessage = 'An unexpected error occurred';
    let shouldShowToast = true;

    // Handle different error types
    switch (error.status) {
      case 0:
        // Network error - no connection
        errorMessage = 'No internet connection. Please check your network.';
        break;

      case 400:
        // Bad Request
        errorMessage =
          error.error?.message || 'Invalid request. Please check your input.';
        break;

      case 401:
        // Unauthorized - token expired or invalid
        errorMessage = 'Session expired. Please login again.';
        await this.handleUnauthorized();
        break;

      case 403:
        // Forbidden
        errorMessage =
          error.error?.message ||
          "You don't have permission to access this resource.";
        break;

      case 404:
        // Not Found
        errorMessage =
          error.error?.message || 'The requested resource was not found.';
        break;

      case 422:
        // Validation Error
        errorMessage = this.extractValidationErrors(error);
        break;

      case 423:
        // Account Locked (Brute Force Protection)
        errorMessage = this.handleAccountLocked(error);
        break;

      case 429:
        // Rate Limit Exceeded
        errorMessage = this.handleRateLimit(error);
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server Errors
        errorMessage = 'Server error. Please try again later.';
        break;

      default:
        errorMessage = error.error?.message || error.message || errorMessage;
    }

    // Log error for debugging
    console.error('HTTP Error:', {
      status: error.status,
      message: errorMessage,
      url: request.url,
      error: error.error,
    });

    // Show toast notification
    if (shouldShowToast) {
      await this.showErrorToast(errorMessage);
    }
  }

  /**
   * Handle unauthorized errors
   */
  private async handleUnauthorized(): Promise<void> {
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Navigate to login
    await this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  /**
   * Handle account locked error (brute force protection)
   */
  private handleAccountLocked(error: HttpErrorResponse): string {
    const lockoutMinutes = error.error?.lockoutMinutes || 15;
    const attemptsRemaining = error.error?.attemptsRemaining;

    if (attemptsRemaining !== undefined) {
      return `Too many failed login attempts. ${attemptsRemaining} attempts remaining before account lockout.`;
    }

    return `Account temporarily locked due to multiple failed login attempts. Please try again in ${lockoutMinutes} minutes.`;
  }

  /**
   * Handle rate limit error
   */
  private handleRateLimit(error: HttpErrorResponse): string {
    const retryAfter = error.headers?.get('Retry-After');
    const limit = error.headers?.get('X-RateLimit-Limit');

    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      const minutes = Math.ceil(seconds / 60);
      return `Too many requests. Please try again in ${minutes} minute${
        minutes > 1 ? 's' : ''
      }.`;
    }

    return `Too many requests. Please slow down and try again later.`;
  }

  /**
   * Extract validation errors from response
   */
  private extractValidationErrors(error: HttpErrorResponse): string {
    const errors = error.error?.errors || error.error?.details;

    if (Array.isArray(errors)) {
      return errors.map((e: any) => e.message || e).join(', ');
    }

    if (typeof errors === 'object') {
      return Object.values(errors).flat().join(', ');
    }

    return (
      error.error?.message || 'Validation failed. Please check your input.'
    );
  }

  /**
   * Show error toast notification
   */
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 4000,
      position: 'top',
      color: 'danger',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
        },
      ],
    });
    await toast.present();
  }
}
