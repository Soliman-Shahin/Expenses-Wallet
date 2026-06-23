import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

async function handleUnauthorized(router: Router): Promise<void> {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  await router.navigate(['/login'], {
    queryParams: { returnUrl: router.url },
  });
}

function handleAccountLocked(error: HttpErrorResponse): string {
  const lockoutMinutes = error.error?.lockoutMinutes || 15;
  const attemptsRemaining = error.error?.attemptsRemaining;
  if (attemptsRemaining !== undefined) {
    return `Too many failed login attempts. ${attemptsRemaining} attempts remaining before account lockout.`;
  }
  return `Account temporarily locked due to multiple failed login attempts. Please try again in ${lockoutMinutes} minutes.`;
}

function handleRateLimit(error: HttpErrorResponse): string {
  const retryAfter = error.headers?.get('Retry-After');
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    const minutes = Math.ceil(seconds / 60);
    return `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
  }
  return `Too many requests. Please slow down and try again later.`;
}

function extractValidationErrors(error: HttpErrorResponse): string {
  const errors = error.error?.errors || error.error?.details;
  if (Array.isArray(errors)) {
    return errors.map((e: any) => e.message || e).join(', ');
  }
  if (typeof errors === 'object' && errors !== null) {
    return Object.values(errors).flat().join(', ');
  }
  return error.error?.message || 'Validation failed. Please check your input.';
}

async function showErrorToast(toastController: ToastController, message: string): Promise<void> {
  const toast = await toastController.create({
    message: message,
    duration: 4000,
    position: 'top',
    color: 'danger',
    buttons: [{ text: 'Dismiss', role: 'cancel' }],
  });
  await toast.present();
}

async function handleError(
  error: HttpErrorResponse,
  request: HttpRequest<unknown>,
  toastController: ToastController,
  router: Router
): Promise<void> {
  let errorMessage = 'An unexpected error occurred';
  let shouldShowToast = true;

  switch (error.status) {
    case 0:
      errorMessage = 'No internet connection. Please check your network.';
      break;
    case 400:
      errorMessage = error.error?.message || 'Invalid request. Please check your input.';
      break;
    case 401:
      errorMessage = 'Session expired. Please login again.';
      await handleUnauthorized(router);
      break;
    case 403:
      errorMessage = error.error?.message || "You don't have permission to access this resource.";
      break;
    case 404:
      errorMessage = error.error?.message || 'The requested resource was not found.';
      break;
    case 422:
      errorMessage = extractValidationErrors(error);
      break;
    case 423:
      errorMessage = handleAccountLocked(error);
      break;
    case 429:
      errorMessage = handleRateLimit(error);
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      errorMessage = 'Server error. Please try again later.';
      break;
    default:
      errorMessage = error.error?.message || error.message || errorMessage;
  }

  console.error('HTTP Error:', {
    status: error.status,
    message: errorMessage,
    url: request.url,
    error: error.error,
  });

  if (shouldShowToast) {
    await showErrorToast(toastController, errorMessage);
  }
}

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const toastController = inject(ToastController);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      handleError(error, req, toastController, router);
      return throwError(() => error);
    })
  );
};
