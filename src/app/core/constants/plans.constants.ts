/**
 * Plans Constants
 *
 * Plan colors, icons, and display information
 */

import { PlanSlug } from '../../shared/models/plan.model';

export const PLAN_COLORS: Record<PlanSlug, string> = {
  [PlanSlug.FREE]: '#6c757d',
  [PlanSlug.BASIC]: '#0d6efd',
  [PlanSlug.PRO]: '#6f42c1',
  [PlanSlug.ENTERPRISE]: '#d63384',
};

export const PLAN_IONIC_COLORS: Record<PlanSlug, string> = {
  [PlanSlug.FREE]: 'medium',
  [PlanSlug.BASIC]: 'primary',
  [PlanSlug.PRO]: 'secondary',
  [PlanSlug.ENTERPRISE]: 'tertiary',
};

export const PLAN_ICONS: Record<PlanSlug, string> = {
  [PlanSlug.FREE]: 'gift-outline',
  [PlanSlug.BASIC]: 'star-outline',
  [PlanSlug.PRO]: 'rocket-outline',
  [PlanSlug.ENTERPRISE]: 'business-outline',
};

export interface PlanDisplayInfo {
  name: string;
  nameAr: string;
  tagline: string;
  taglineAr: string;
  color: string;
  ionicColor: string;
  icon: string;
}

export const PLAN_DISPLAY_INFO: Record<PlanSlug, PlanDisplayInfo> = {
  [PlanSlug.FREE]: {
    name: 'Free',
    nameAr: 'مجاني',
    tagline: 'Get started for free',
    taglineAr: 'ابدأ مجاناً',
    color: PLAN_COLORS[PlanSlug.FREE],
    ionicColor: PLAN_IONIC_COLORS[PlanSlug.FREE],
    icon: PLAN_ICONS[PlanSlug.FREE],
  },
  [PlanSlug.BASIC]: {
    name: 'Basic',
    nameAr: 'أساسي',
    tagline: 'Essential features for personal use',
    taglineAr: 'الميزات الأساسية للاستخدام الشخصي',
    color: PLAN_COLORS[PlanSlug.BASIC],
    ionicColor: PLAN_IONIC_COLORS[PlanSlug.BASIC],
    icon: PLAN_ICONS[PlanSlug.BASIC],
  },
  [PlanSlug.PRO]: {
    name: 'Pro',
    nameAr: 'احترافي',
    tagline: 'Advanced features for power users',
    taglineAr: 'ميزات متقدمة للمستخدمين المحترفين',
    color: PLAN_COLORS[PlanSlug.PRO],
    ionicColor: PLAN_IONIC_COLORS[PlanSlug.PRO],
    icon: PLAN_ICONS[PlanSlug.PRO],
  },
  [PlanSlug.ENTERPRISE]: {
    name: 'Enterprise',
    nameAr: 'مؤسسات',
    tagline: 'Complete solution for businesses',
    taglineAr: 'حل متكامل للشركات',
    color: PLAN_COLORS[PlanSlug.ENTERPRISE],
    ionicColor: PLAN_IONIC_COLORS[PlanSlug.ENTERPRISE],
    icon: PLAN_ICONS[PlanSlug.ENTERPRISE],
  },
};

/**
 * Get plan display info
 */
export function getPlanDisplayInfo(slug: PlanSlug): PlanDisplayInfo {
  return PLAN_DISPLAY_INFO[slug] || PLAN_DISPLAY_INFO[PlanSlug.FREE];
}

/**
 * Get plan name in current language
 */
export function getPlanName(slug: PlanSlug, lang: 'en' | 'ar' = 'en'): string {
  const info = PLAN_DISPLAY_INFO[slug];
  return lang === 'ar' ? info.nameAr : info.name;
}

/**
 * Get plan tagline in current language
 */
export function getPlanTagline(slug: PlanSlug, lang: 'en' | 'ar' = 'en'): string {
  const info = PLAN_DISPLAY_INFO[slug];
  return lang === 'ar' ? info.taglineAr : info.tagline;
}
