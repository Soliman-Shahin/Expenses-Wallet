export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
  routeKey: 'notification-detail';
  isRead: boolean;
  createdAt: string;
}
