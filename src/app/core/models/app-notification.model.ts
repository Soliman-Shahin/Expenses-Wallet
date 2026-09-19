export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
  routeKey: 'notification-detail';
  event?: string;
  category?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationTypePresentation {
  icon: string;
  tone: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  labelKey: string;
}
const TYPE_PRESENTATION: Record<string, NotificationTypePresentation> = {
  info: {
    icon: 'information-circle-outline',
    tone: 'info',
    labelKey: 'SETTINGS.NOTIFICATION_TYPE_INFO',
  },
  success: {
    icon: 'checkmark-circle-outline',
    tone: 'success',
    labelKey: 'SETTINGS.NOTIFICATION_TYPE_SUCCESS',
  },
  warn: {
    icon: 'warning-outline',
    tone: 'warning',
    labelKey: 'SETTINGS.NOTIFICATION_TYPE_WARNING',
  },
  error: {
    icon: 'alert-circle-outline',
    tone: 'error',
    labelKey: 'SETTINGS.NOTIFICATION_TYPE_ERROR',
  },
};
export function notificationTypePresentation(
  type: unknown
): NotificationTypePresentation {
  return (
    TYPE_PRESENTATION[String(type)] || {
      icon: 'notifications-outline',
      tone: 'neutral',
      labelKey: 'SETTINGS.NOTIFICATION_TYPE_UNKNOWN',
    }
  );
}
