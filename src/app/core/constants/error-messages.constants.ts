/**
 * Error Messages Constants
 *
 * Translation keys for permission and plan error messages.
 * Uses i18n translation files for actual messages.
 */

import { Permission, PlanSlug } from '../../shared/models/plan.model';

/**
 * Get error translation keys for a permission
 * Returns keys to use with TranslateService
 * 
 * @example
 * const keys = getPermissionErrorKeys(Permission.EXPENSE_EXPORT);
 * // Returns: {
 * //   titleKey: 'PERMISSION_ERRORS.ACCESS_DENIED',
 * //   messageKey: 'PERMISSION_ERRORS.FEATURE_LOCKED',
 * //   ...
 * // }
 * 
 * // Usage in component:
 * this.translate.get(keys.titleKey).subscribe(title => console.log(title));
 */
export function getPermissionErrorKeys(permission: Permission): {
  titleKey: string;
  messageKey: string;
  suggestionKey: string;
  requiredPlan?: PlanSlug;
} {
  // Default error keys
  return {
    titleKey: 'PERMISSION_ERRORS.ACCESS_DENIED',
    messageKey: 'PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS',
    suggestionKey: 'PERMISSION_ERRORS.UPGRADE_TO_UNLOCK',
    requiredPlan: getPlanForPermission(permission),
  };
}

/**
 * Get required plan for a permission
 * Maps permissions to their required plan level
 */
function getPlanForPermission(permission: Permission): PlanSlug | undefined {
  // Map permissions to required plans
  const planMap: Partial<Record<Permission, PlanSlug>> = {
    [Permission.EXPENSE_EXPORT]: PlanSlug.PRO,
    [Permission.REPORT_ADVANCED]: PlanSlug.PRO,
    [Permission.BACKUP_GDRIVE]: PlanSlug.PRO,
    [Permission.SYNC_MULTI_DEVICE]: PlanSlug.PRO,
    [Permission.SUPPORT_PRIORITY]: PlanSlug.PRO,
    [Permission.SECURITY_ADVANCED_ENCRYPTION]: PlanSlug.PRO,
    [Permission.CATEGORY_CREATE]: PlanSlug.BASIC,
    [Permission.CATEGORY_UPDATE]: PlanSlug.BASIC,
    [Permission.CATEGORY_DELETE]: PlanSlug.BASIC,
    [Permission.BACKUP_LOCAL]: PlanSlug.BASIC,
    [Permission.PROFILE_AVATAR]: PlanSlug.BASIC,
    [Permission.SECURITY_BIOMETRIC]: PlanSlug.BASIC,
  };

  return planMap[permission];
}

/**
 * Get error keys for plan-related errors
 */
export function getPlanErrorKeys(errorType: 'REQUIRED' | 'EXPIRED'): {
  titleKey: string;
  messageKey: string;
  suggestionKey: string;
} {
  if (errorType === 'EXPIRED') {
    return {
      titleKey: 'PERMISSION_ERRORS.PLAN_EXPIRED',
      messageKey: 'PERMISSION_ERRORS.RENEW_SUBSCRIPTION',
      suggestionKey: 'PERMISSION_ERRORS.CONTACT_SUPPORT',
    };
  }

  return {
    titleKey: 'PERMISSION_ERRORS.PLAN_REQUIRED',
    messageKey: 'PERMISSION_ERRORS.FEATURE_LOCKED',
    suggestionKey: 'PERMISSION_ERRORS.UPGRADE_TO_UNLOCK',
  };
}
