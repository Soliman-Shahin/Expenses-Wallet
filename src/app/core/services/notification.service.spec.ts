import { NgZone } from '@angular/core';
import { of } from 'rxjs';
import { NotificationService } from './notification.service';

describe('NotificationService realtime state', () => {
  const api = {
    get: jasmine.createSpy('get').and.returnValue(of({ data: [] })),
    patch: jasmine.createSpy('patch').and.returnValue(of({})),
  } as any;
  const token = {
    getUserId: () => 'user-a',
    getAccessToken: () => null,
  } as any;
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService(
      api,
      token,
      new NgZone({ enableLongStackTrace: false })
    );
  });

  it('merges a realtime item and ignores the same id twice', () => {
    const item = {
      id: '507f1f77bcf86cd799439011',
      title: 'Live',
      message: 'Test',
      type: 'info',
      routeKey: 'notification-detail',
      isRead: false,
      createdAt: new Date().toISOString(),
    } as any;
    (service as any).receiveRealtime(item);
    (service as any).receiveRealtime(item);
    let values: any[] = [];
    service.notifications$.subscribe((items) => (values = items));
    expect(values.length).toBe(1);
    expect(values[0].id).toBe(item.id);
  });

  it('keeps a realtime item when REST refresh returns older data', () => {
    const item = {
      id: '507f1f77bcf86cd799439011',
      title: 'Live',
      message: 'Test',
      type: 'info',
      routeKey: 'notification-detail',
      isRead: false,
      createdAt: new Date().toISOString(),
    } as any;
    (service as any).receiveRealtime(item);
    api.get.and.returnValue(of({ data: [] }));
    service.load(true).subscribe();
    let values: any[] = [];
    service.notifications$.subscribe((items) => (values = items));
    expect(values.map((entry) => entry.id)).toEqual([item.id]);
  });
});
