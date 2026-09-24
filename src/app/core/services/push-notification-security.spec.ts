import { NgZone } from '@angular/core';
import { PushNotificationService } from './push-notification.service';

describe('security.new_login push navigation', () => {
  it('routes a security notification tap through the existing detail route', async () => {
    const navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    const service = Object.create(PushNotificationService.prototype) as any;
    service.router = { navigate };
    service.zone = new NgZone({ enableLongStackTrace: false });
    service['tokenService'] = {
      getAccessToken: () => 'token',
      isTokenExpired: () => false,
    } as any;

    await service['handleNotificationData']({
      notificationId: '507f1f77bcf86cd799439011',
      routeKey: 'notification-detail',
      event: 'security.new_login',
      category: 'security',
    });

    expect(navigate).toHaveBeenCalledOnceWith([
      '/notifications',
      '507f1f77bcf86cd799439011',
    ]);
  });

  it('rejects malformed or unrelated push routes without navigation', async () => {
    const navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    const service = Object.create(PushNotificationService.prototype) as any;
    service.router = { navigate };
    service.zone = new NgZone({ enableLongStackTrace: false });
    service['tokenService'] = {
      getAccessToken: () => 'token',
      isTokenExpired: () => false,
    } as any;

    await service['handleNotificationData']({
      notificationId: 'not-a-notification-id',
      routeKey: 'other-route',
      event: 'security.new_login',
    });

    expect(navigate).not.toHaveBeenCalled();
  });
});
