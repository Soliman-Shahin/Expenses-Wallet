import { NotificationChannel } from 'src/app/core/models/notification-preference.model';

export const NOTIFICATION_CATEGORY_PRESENTATION = [
  { key: 'security' as const, title: 'SETTINGS.NOTIFICATION_CATEGORY_SECURITY', description: 'SETTINGS.NOTIFICATION_CATEGORY_SECURITY_DESC', mandatory: true, icon: 'shield-checkmark' },
  { key: 'general' as const, title: 'SETTINGS.NOTIFICATION_CATEGORY_GENERAL', description: 'SETTINGS.NOTIFICATION_CATEGORY_GENERAL_DESC', mandatory: true, icon: 'information-circle' },
  { key: 'sync' as const, title: 'SETTINGS.NOTIFICATION_CATEGORY_SYNC', description: 'SETTINGS.NOTIFICATION_CATEGORY_SYNC_DESC', mandatory: false, icon: 'sync' },
  { key: 'subscription' as const, title: 'SETTINGS.NOTIFICATION_CATEGORY_SUBSCRIPTION', description: 'SETTINGS.NOTIFICATION_CATEGORY_SUBSCRIPTION_DESC', mandatory: false, icon: 'card' },
] as const;

export const NOTIFICATION_CHANNEL_PRESENTATION = [
  { key: 'inbox' as const, label: 'SETTINGS.NOTIFICATION_CHANNEL_INBOX' },
  { key: 'realtime' as const, label: 'SETTINGS.NOTIFICATION_CHANNEL_REALTIME' },
  { key: 'push' as const, label: 'SETTINGS.NOTIFICATION_CHANNEL_PUSH' },
] as const satisfies readonly { key: NotificationChannel; label: string }[];
