import { of, Subject, throwError } from 'rxjs';
import { NotificationPreferenceService } from './notification-preference.service';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../models/notification-preference.model';

describe('NotificationPreferenceService', () => {
  function createService(api: any, getUserId = () => 'user-a') {
    return new NotificationPreferenceService(api, { getUserId } as any);
  }

  it('uses safe all-enabled defaults before a server response', () => {
    const service = createService({});
    expect(service.current).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('loads and updates the current owner preferences', () => {
    const categories = {
      sync: { inbox: true, realtime: true, push: false },
      subscription: { inbox: true, realtime: true, push: true },
      security: { inbox: true, realtime: true, push: true },
      general: { inbox: true, realtime: true, push: true },
    } as const;
    const api = {
      get: jasmine.createSpy().and.returnValue(of({ categories })),
      patch: jasmine.createSpy().and.returnValue(of({ categories })),
    };
    const service = createService(api);

    service.load().subscribe();
    expect(service.current).toEqual(categories);
    service.update({ sync: { push: false } }).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/notifications/preferences', {
      sync: { push: false },
    });
    service.clearForOwner();
    expect(service.current.sync.push).toBe(true);
  });

  it('keeps server state unchanged when the preference API fails', () => {
    const api = {
      get: jasmine.createSpy().and.returnValue(
        throwError(() => new Error('request failed'))
      ),
    };
    const service = createService(api);
    service.load().subscribe({ error: () => undefined });
    expect(service.current).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('clears owner A before owner B is active', () => {
    const service = createService({});
    service.clearForOwner();
    expect(service.current).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('does not apply a stale owner A response after switching to owner B', () => {
    let owner = 'user-a';
    const response$ = new Subject<any>();
    const api = { get: jasmine.createSpy().and.returnValue(response$) };
    const service = createService(api, () => owner);

    service.load().subscribe();
    owner = 'user-b';
    response$.next({
      categories: {
        sync: { inbox: false, realtime: false, push: false },
        subscription: { inbox: true, realtime: true, push: true },
        security: { inbox: true, realtime: true, push: true },
        general: { inbox: true, realtime: true, push: true },
      },
    });

    expect(service.current).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });
});
