/**
 * Role Guard (Functional Guard - Angular 15+)
 *
 * Prevents access to routes that require a specific user role.
 * Uses ROLE_WEIGHTS from role.model for consistent role hierarchy.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { UserRole, hasRoleLevel, getRoleDisplayName } from '../models/role.model';
import { ToastService } from '../../shared/services/toast.service';

// This would typically come from an AuthService
// For now, we'll inject it when available
interface AuthService {
  getCurrentUser(): { role: UserRole } | null;
}

/**
 * Role Guard
 *
 * Usage in routes:
 *   canActivate: [roleGuard],
 *   data: { requiredRole: UserRole.ADMIN }
 */
export const roleGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot
) => {
  const router = inject(Router);
  const toastService = inject(ToastService);
  
  // TODO: Inject AuthService when available
  // const authService = inject(AuthService);
  
  const requiredRole = route.data['requiredRole'] as UserRole | undefined;

  if (!requiredRole) {
    // No role requirement specified, allow access
    return true;
  }

  try {
    // TODO: Get current user from AuthService
    // const currentUser = authService.getCurrentUser();
    
    // For now, return false and show message
    // This will be updated when AuthService is integrated
    
    await toastService.show({
      message: `This area requires ${getRoleDisplayName(requiredRole)} role.`,
      color: 'warning',
      duration: 3000,
      position: 'bottom',
    });
    
    router.navigate(['/']);
    return false;
    
    /* 
    // Future implementation:
    if (!currentUser) {
      router.navigate(['/login']);
      return false;
    }

    // Check if user's role meets the requirement
    if (hasRoleLevel(currentUser.role, requiredRole)) {
      return true;
    }

    // Role requirement not met
    const currentRoleName = getRoleDisplayName(currentUser.role);
    const requiredRoleName = getRoleDisplayName(requiredRole);
    
    await toastService.show({
      message: `This area requires ${requiredRoleName} role. You are currently ${currentRoleName}.`,
      color: 'warning',
      duration: 3000,
      position: 'bottom',
    });
    
    router.navigate(['/']);
    return false;
    */
  } catch (error) {
    console.error('Error in roleGuard:', error);
    await toastService.show({
      message: 'Unable to verify your role. Please try again.',
      color: 'danger',
      duration: 3000,
      position: 'bottom',
    });
    return false;
  }
};

/**
 * Helper function to create a role guard for a specific role
 * Makes route configuration cleaner
 */
export function createRoleGuard(role: UserRole): CanActivateFn {
  return (route) => {
    route.data = { ...route.data, requiredRole: role };
    return roleGuard(route, {} as any);
  };
}

/**
 * Admin Guard - Shortcut for admin-only routes
 */
export const adminGuard: CanActivateFn = (route) => {
  route.data = { ...route.data, requiredRole: UserRole.ADMIN };
  return roleGuard(route, {} as any);
};

/**
 * Super Admin Guard - Shortcut for super admin-only routes
 */
export const superAdminGuard: CanActivateFn = (route) => {
  route.data = { ...route.data, requiredRole: UserRole.SUPERADMIN };
  return roleGuard(route, {} as any);
};
