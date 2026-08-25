/**
 * Role Model
 *
 * User role definitions and hierarchy
 */

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

/**
 * Role hierarchy weights for comparison
 */
export const ROLE_WEIGHTS: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.MODERATOR]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPERADMIN]: 3,
};

/**
 * Check if a user role meets or exceeds a required role
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_WEIGHTS[userRole] >= ROLE_WEIGHTS[requiredRole];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    [UserRole.USER]: 'User',
    [UserRole.MODERATOR]: 'Moderator',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.SUPERADMIN]: 'Super Admin',
  };
  return names[role] || role;
}

/**
 * Get role color for UI
 */
export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    [UserRole.USER]: 'medium',
    [UserRole.MODERATOR]: 'primary',
    [UserRole.ADMIN]: 'warning',
    [UserRole.SUPERADMIN]: 'danger',
  };
  return colors[role] || 'medium';
}
