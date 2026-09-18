export type NotificationCategory =
  | 'sync'
  | 'subscription'
  | 'security'
  | 'general';
export type NotificationChannel = 'inbox' | 'realtime' | 'push';

export interface NotificationPreferenceChannels {
  inbox: boolean;
  realtime: boolean;
  push: boolean;
}

export type NotificationPreferences = Record<
  NotificationCategory,
  NotificationPreferenceChannels
>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  sync: { inbox: true, realtime: true, push: true },
  subscription: { inbox: true, realtime: true, push: true },
  security: { inbox: true, realtime: true, push: true },
  general: { inbox: true, realtime: true, push: true },
};
