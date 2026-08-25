/**
 * Permission Error Interceptor
 *
 * Intercepts HTTP errors related to permissions and plans.
 * Shows appropriate messages and handles upgrade prompts.
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';
import { getPermissionErrorKeys } from '../constants/error-messages.constants';
import { Permission, PlanSlug } from '../../shared/models/plan.model';

export const permissionErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        handlePermissionError(error, router, toastService);
      } else if (error.status === 429) {
        handleRateLimitError(error, toastService);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Handle 403 Permission Denied errors
 */
async function handlePermissionError(
  error: HttpErrorResponse,
  router: Router,
  toastService: ToastService
): Promise<void> {
  const errorData = error.error;

  // Check if it's a plan-related error
  if (errorData.error === 'PLAN_REQUIRED' || errorData.error === 'PLAN_EXPIRED') {
    const requiredPlan = errorData.requiredPlan as PlanSlug;
    const message = errorData.message || 'Upgrade required to access this feature';
    
    await toastService.show({
      message,
      color: 'warning',
      duration: 4000,
      position: 'bottom',
    });

    // Navigate to subscription page with context
    router.navigate(['/subscription'], {
      queryParams: {
        required: requiredPlan,
        feature: errorData.feature,
        reason: errorData.error,
      },
    });
  } else if (errorData.error === 'PERMISSION_DENIED') {
    // Generic permission denied
    const message = errorData.message || 'You don\'t have permission to perform this action';

    await toastService.show({
      message,
      color: 'warning',
      duration: 3000,
      position: 'bottom',
    });
  } else {
    // Generic 403 error
    await toastService.show({
      message: errorData.message || 'Access denied',
      color: 'danger',
      duration: 3000,
      position: 'bottom',
    });
  }
}

/**
 * Handle 429 Rate Limit errors
 */
async function handleRateLimitError(
  error: HttpErrorResponse,
  toastService: ToastService
): Promise<void> {
  const errorData = error.error;
  const retryAfter = errorData.retryAfter || 60;
  const message = errorData.message || `Too many requests. Please try again in ${retryAfter} seconds.`;

  await toastService.show({
    message,
    color: 'warning',
    duration: 5000,
    position: 'bottom',
  });
}
