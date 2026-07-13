import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PlanService, Permission } from '../services/plan.service';
import { ToastService } from '../../shared/services/toast.service';

/**
 * Permission Guard
 *
 * Prevents access to routes that require specific permissions.
 * Usage in routes:
 *   data: { requiredPermission: Permission.EXPENSE_EXPORT }
 *   data: { requiredPermissions: [Permission.EXPENSE_EXPORT, Permission.REPORT_ADVANCED] }
 *   data: { requireAllPermissions: true } // default is false (any permission)
 */
export const permissionGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot
) => {
  const planService = inject(PlanService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const requiredPermission = route.data['requiredPermission'] as
    | Permission
    | undefined;
  const requiredPermissions = route.data['requiredPermissions'] as
    | Permission[]
    | undefined;
  const requireAll = route.data['requireAllPermissions'] as boolean | undefined;

  // If no permission requirement specified, allow access
  if (!requiredPermission && !requiredPermissions) {
    return true;
  }

  try {
    // Ensure we have the latest plan data
    await planService.getMyPlan();

    let hasAccess = false;

    if (requiredPermission) {
      // Single permission check
      hasAccess = planService.hasPermission(requiredPermission);
    } else if (requiredPermissions) {
      // Multiple permissions check
      if (requireAll) {
        hasAccess = planService.hasAllPermissions(requiredPermissions);
      } else {
        hasAccess = planService.hasAnyPermission(requiredPermissions);
      }
    }

    if (hasAccess) {
      return true;
    }

    // Permission denied
    const message = requiredPermission
      ? planService.getFeatureLockedMessage(requiredPermission)
      : 'You do not have permission to access this feature.';

    await toastService.show({
      message,
      color: 'warning',
      duration: 3000,
      position: 'bottom',
    });
    router.navigate(['/subscription']);
    return false;
  } catch (error) {
    console.error('Error in permissionGuard:', error);
    await toastService.show({
      message: 'Unable to verify your permissions. Please try again.',
      color: 'danger',
      duration: 3000,
      position: 'bottom',
    });
    return false;
  }
};
