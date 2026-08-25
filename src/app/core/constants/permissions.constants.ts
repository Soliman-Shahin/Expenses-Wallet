/**
 * Permissions Constants
 *
 * Permission groups and translation keys for UI display.
 * Uses i18n translation files for labels.
 */

import { Permission } from '../../shared/models/plan.model';

export interface PermissionGroup {
  translationKey: string; // Key in i18n files: PERMISSION_GROUPS.{key}
  icon: string;
  permissions: Permission[];
}

export const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
  categories: {
    translationKey: 'PERMISSION_GROUPS.CATEGORIES',
    icon: 'folder-outline',
    permissions: [
      Permission.CATEGORY_CREATE,
      Permission.CATEGORY_READ,
      Permission.CATEGORY_UPDATE,
      Permission.CATEGORY_DELETE,
    ],
  },
  expenses: {
    translationKey: 'PERMISSION_GROUPS.EXPENSES',
    icon: 'wallet-outline',
    permissions: [
      Permission.EXPENSE_CREATE,
      Permission.EXPENSE_READ,
      Permission.EXPENSE_UPDATE,
      Permission.EXPENSE_DELETE,
      Permission.EXPENSE_EXPORT,
    ],
  },
  reports: {
    translationKey: 'PERMISSION_GROUPS.REPORTS',
    icon: 'bar-chart-outline',
    permissions: [
      Permission.REPORT_VIEW,
      Permission.REPORT_ADVANCED,
    ],
  },
  backup: {
    translationKey: 'PERMISSION_GROUPS.BACKUP',
    icon: 'cloud-outline',
    permissions: [
      Permission.BACKUP_LOCAL,
      Permission.BACKUP_GDRIVE,
      Permission.SYNC_MULTI_DEVICE,
    ],
  },
  profile: {
    translationKey: 'PERMISSION_GROUPS.PROFILE',
    icon: 'person-outline',
    permissions: [
      Permission.PROFILE_UPDATE,
      Permission.PROFILE_AVATAR,
    ],
  },
  support: {
    translationKey: 'PERMISSION_GROUPS.SUPPORT',
    icon: 'help-circle-outline',
    permissions: [
      Permission.SUPPORT_PRIORITY,
    ],
  },
  security: {
    translationKey: 'PERMISSION_GROUPS.SECURITY',
    icon: 'shield-checkmark-outline',
    permissions: [
      Permission.SECURITY_ADVANCED_ENCRYPTION,
      Permission.SECURITY_BIOMETRIC,
    ],
  },
  admin: {
    translationKey: 'PERMISSION_GROUPS.ADMIN',
    icon: 'settings-outline',
    permissions: [
      Permission.ADMIN_DASHBOARD,
      Permission.ADMIN_USERS,
      Permission.ADMIN_CATEGORIES,
      Permission.ADMIN_EXPENSES,
      Permission.ADMIN_SYNC,
      Permission.ADMIN_HEALTH,
      Permission.ADMIN_PLANS,
    ],
  },
};

/**
 * Get permission translation key for i18n
 * Returns the key to use with TranslateService
 *
 * @example
 * const key = getPermissionTranslationKey(Permission.EXPENSE_EXPORT);
 * // Returns: 'PLAN_FEATURES.EXPENSE_EXPORT'
 *
 * // Usage in component:
 * this.translate.get(key).subscribe(label => console.log(label));
 *
 * // Usage in template:
 * {{ getPermissionTranslationKey(permission) | translate }}
 */
export function getPermissionTranslationKey(permission: Permission): string {
  // Convert permission enum to translation key
  // e.g., 'expense:export' -> 'EXPENSE_EXPORT'
  const key = permission.replace(':', '_').toUpperCase();
  return `PLAN_FEATURES.${key}`;
}
