import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';

/**
 * Plan Limit Interceptor
 *
 * Intercepts HTTP errors related to plan limits and permissions.
 * Automatically shows upgrade prompts when users hit plan limits.
 */
export const planLimitInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if this is a plan-related error
      if (error.status === 403 && error.error?.code) {
        const errorCode = error.error.code;
        const errorMessage = error.error.message || 'Access denied';
        const errorDetails = error.error.details;

        switch (errorCode) {
          case 'PLAN_LIMIT_EXCEEDED':
            handlePlanLimitExceeded(
              errorMessage,
              errorDetails,
              router,
              toastService
            );
            break;

          case 'PERMISSION_DENIED':
            handlePermissionDenied(
              errorMessage,
              errorDetails,
              router,
              toastService
            );
            break;

          case 'PLAN_EXPIRED':
            handlePlanExpired(errorMessage, router, toastService);
            break;

          default:
            // Other 403 errors, show generic message
            toastService.show({
              message: errorMessage,
              color: 'warning',
              duration: 3000,
              position: 'bottom',
            });
        }
      }

      return throwError(() => error);
    })
  );
};

// ==================== Helper Functions ====================

function handlePlanLimitExceeded(
  message: string,
  details: any,
  router: Router,
  toastService: ToastService
): void {
  const limitType = details?.limitType || 'resource';
  const currentCount = details?.currentCount ?? 0;
  const maxAllowed = details?.maxAllowed ?? 0;
  const planSlug = details?.planSlug || 'current';

  // Show detailed toast
  toastService.show({
    message: `${message} (${currentCount}/${maxAllowed})`,
    color: 'warning',
    duration: 4000,
    position: 'bottom',
    cssClassExtra: ['toast-plan-limit'],
  });

  // Navigate to subscription page after a short delay
  setTimeout(() => {
    router.navigate(['/subscription'], {
      queryParams: {
        reason: 'limit_exceeded',
        limitType,
        currentPlan: planSlug,
      },
    });
  }, 1500);
}

function handlePermissionDenied(
  message: string,
  details: any,
  router: Router,
  toastService: ToastService
): void {
  const permission = details?.permission || 'feature';
  const currentPlan = details?.currentPlan || 'current';

  toastService.show({
    message,
    color: 'warning',
    duration: 4000,
    position: 'bottom',
    cssClassExtra: ['toast-permission-denied'],
  });

  // Navigate to subscription page
  setTimeout(() => {
    router.navigate(['/subscription'], {
      queryParams: {
        reason: 'permission_denied',
        permission,
        currentPlan,
      },
    });
  }, 1500);
}

function handlePlanExpired(
  message: string,
  router: Router,
  toastService: ToastService
): void {
  toastService.show({
    message,
    color: 'danger',
    duration: 4000,
    position: 'bottom',
    cssClassExtra: ['toast-plan-expired'],
  });

  // Navigate to subscription page
  setTimeout(() => {
    router.navigate(['/subscription'], {
      queryParams: {
        reason: 'expired',
      },
    });
  }, 1500);
}
