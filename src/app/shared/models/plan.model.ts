/**
 * Plan & Subscription Models
 *
 * Shared type definitions for the subscription plan system.
 */

// ==================== Enums ====================

export enum PlanSlug {
  Free = 'free',
  Pro = 'pro',
  Premium = 'premium',
}

export enum Permission {
  // Categories
  CATEGORY_CREATE = 'category:create',
  CATEGORY_READ = 'category:read',
  CATEGORY_UPDATE = 'category:update',
  CATEGORY_DELETE = 'category:delete',

  // Expenses
  EXPENSE_CREATE = 'expense:create',
  EXPENSE_READ = 'expense:read',
  EXPENSE_UPDATE = 'expense:update',
  EXPENSE_DELETE = 'expense:delete',
  EXPENSE_EXPORT = 'expense:export',

  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_ADVANCED = 'report:advanced',

  // Backup & Sync
  BACKUP_LOCAL = 'backup:local',
  BACKUP_GDRIVE = 'backup:gdrive',
  SYNC_MULTI_DEVICE = 'sync:multi_device',

  // Profile
  PROFILE_UPDATE = 'profile:update',
  PROFILE_AVATAR = 'profile:avatar',

  // Support
  SUPPORT_PRIORITY = 'support:priority',

  // Security
  SECURITY_ADVANCED_ENCRYPTION = 'security:advanced_encryption',
  SECURITY_BIOMETRIC = 'security:biometric',

  // Admin
  ADMIN_DASHBOARD = 'admin:dashboard',
  ADMIN_USERS = 'admin:users',
  ADMIN_CATEGORIES = 'admin:categories',
  ADMIN_EXPENSES = 'admin:expenses',
  ADMIN_SYNC = 'admin:sync',
  ADMIN_HEALTH = 'admin:health',
  ADMIN_PLANS = 'admin:plans',
}

// ==================== Interfaces ====================

export interface PlanLimits {
  maxCategories: number | null;
  maxTransactionsPerMonth: number | null;
  maxBackupFiles: number | null;
  maxDevices: number | null;
}

export interface Plan {
  _id: string;
  name: string;
  slug: PlanSlug;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  limits: PlanLimits;
  features: Permission[];
  isActive: boolean;
  isPopular: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserPlanContext {
  planSlug: PlanSlug;
  permissions: Permission[];
  limits: PlanLimits;
  planExpiresAt: Date | null;
  planStartedAt?: Date | null;
  isExpired: boolean;
}

export interface UsageStats {
  categories: {
    used: number;
    limit: number | null;
    percentage: number;
  };
  transactionsThisMonth: {
    used: number;
    limit: number | null;
    percentage: number;
  };
}

export interface Subscription {
  _id: string;
  user: string;
  plan: Plan | string;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  startDate: Date;
  endDate: Date | null;
  cancelledAt?: Date;
  trialEndsAt?: Date;
  paymentMethod?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MyPlanResponse {
  plan: Plan;
  context: UserPlanContext;
  usage: UsageStats;
  subscriptionHistory: Subscription[];
}

export interface UpgradePlanRequest {
  planSlug: PlanSlug;
  paymentRef?: string;
}

// ==================== Plan Weights (for comparison) ====================

export const PLAN_WEIGHTS: Record<PlanSlug, number> = {
  [PlanSlug.Free]: 0,
  [PlanSlug.Pro]: 1,
  [PlanSlug.Premium]: 2,
};

// ==================== Helper Functions ====================

/**
 * Checks if a plan meets or exceeds a required plan level
 */
export function isPlanSufficient(
  userPlan: PlanSlug,
  requiredPlan: PlanSlug
): boolean {
  return PLAN_WEIGHTS[userPlan] >= PLAN_WEIGHTS[requiredPlan];
}

/**
 * Returns a user-friendly plan name
 */
export function getPlanDisplayName(slug: PlanSlug): string {
  const names: Record<PlanSlug, string> = {
    [PlanSlug.Free]: 'Free',
    [PlanSlug.Pro]: 'Pro',
    [PlanSlug.Premium]: 'Premium',
  };
  return names[slug] || slug;
}

/**
 * Returns the plan color for UI display
 */
export function getPlanColor(slug: PlanSlug): string {
  const colors: Record<PlanSlug, string> = {
    [PlanSlug.Free]: 'medium',
    [PlanSlug.Pro]: 'primary',
    [PlanSlug.Premium]: 'tertiary',
  };
  return colors[slug] || 'medium';
}
