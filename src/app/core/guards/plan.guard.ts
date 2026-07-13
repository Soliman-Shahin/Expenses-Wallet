import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PlanService, PlanSlug } from '../services/plan.service';
import { ToastService } from '../../shared/services/toast.service';

/**
 * Plan Guard
 *
 * Prevents access to routes that require a specific plan level.
 * Usage in routes:
 *   data: { requiredPlan: PlanSlug.Pro }
 */
export const planGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot
) => {
  const planService = inject(PlanService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const requiredPlan = route.data['requiredPlan'] as PlanSlug | undefined;

  if (!requiredPlan) {
    // No plan requirement specified, allow access
    return true;
  }

  try {
    // Ensure we have the latest plan data
    const myPlan = await planService.getMyPlan();

    // Define plan hierarchy weights
    const planWeights: Record<PlanSlug, number> = {
      [PlanSlug.Free]: 0,
      [PlanSlug.Pro]: 1,
      [PlanSlug.Premium]: 2,
    };

    const userPlanWeight = planWeights[myPlan.context.planSlug] ?? 0;
    const requiredPlanWeight = planWeights[requiredPlan] ?? 0;

    // Check if user's plan meets the requirement
    if (userPlanWeight >= requiredPlanWeight) {
      // Check if plan is expired
      if (myPlan.context.isExpired) {
        await toastService.show({
          message:
            'Your subscription has expired. Please renew to access this feature.',
          color: 'warning',
          duration: 3000,
          position: 'bottom',
        });
        router.navigate(['/subscription']);
        return false;
      }
      return true;
    }

    // Plan requirement not met
    const planName = myPlan.plan.name;
    await toastService.show({
      message: `This feature requires the ${requiredPlan} plan or higher. You are currently on ${planName}.`,
      color: 'warning',
      duration: 3000,
      position: 'bottom',
    });
    router.navigate(['/subscription']);
    return false;
  } catch (error) {
    console.error('Error in planGuard:', error);
    await toastService.show({
      message: 'Unable to verify your plan. Please try again.',
      color: 'danger',
      duration: 3000,
      position: 'bottom',
    });
    return false;
  }
};
