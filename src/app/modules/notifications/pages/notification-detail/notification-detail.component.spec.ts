import {
  NotificationDetailComponent,
  shouldOpenSyncConflict,
} from './notification-detail.component';

describe('sync.conflict notification action', () => {
  const base = {
    id: '507f1f77bcf86cd799439011',
    title: 'Conflict',
    message: 'Review the affected item.',
    type: 'warn' as const,
    routeKey: 'notification-detail' as const,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  it('accepts valid sync conflict metadata for the existing review route', () => {
    expect(
      shouldOpenSyncConflict({
        ...base,
        event: 'sync.conflict',
        category: 'sync',
        metadata: {
          conflictId: 'owner:expense:item:1:2',
          entityType: 'expense',
        },
      })
    ).toBe(true);
  });

  it('rejects missing or invalid metadata without navigation', () => {
    expect(shouldOpenSyncConflict({ ...base, event: 'sync.conflict' })).toBe(
      false
    );
    expect(
      shouldOpenSyncConflict({
        ...base,
        event: 'sync.conflict',
        metadata: { conflictId: '', entityType: 'expense' },
      })
    ).toBe(false);
    expect(
      shouldOpenSyncConflict({
        ...base,
        event: 'sync.conflict',
        metadata: { conflictId: 'internal', entityType: 'user' },
      })
    ).toBe(false);
  });

  it('preserves ordinary notification behavior', () => {
    expect(
      shouldOpenSyncConflict({ ...base, event: 'general.admin_broadcast' })
    ).toBe(false);
  });

  it('uses only the allowlisted internal conflict route for valid metadata', () => {
    expect(
      shouldOpenSyncConflict({
        ...base,
        event: 'sync.conflict',
        metadata: {
          conflictId: 'internal-id',
          entityType: 'expense',
          route: 'https://evil.invalid',
        },
      })
    ).toBe(true);
  });

  it('invokes the click handler and navigates valid conflicts to the actual route', () => {
    const navigate = jasmine.createSpy('navigate');
    const component = Object.create(
      NotificationDetailComponent.prototype
    ) as any;
    component.router = { navigate };
    component.reviewSyncConflict({
      ...base,
      event: 'sync.conflict',
      metadata: { conflictId: 'internal-id', entityType: 'expense' },
    });
    expect(navigate).toHaveBeenCalledOnceWith(['/settings/conflicts']);
  });

  it('does not navigate malformed or unknown notifications', () => {
    const navigate = jasmine.createSpy('navigate');
    const component = Object.create(
      NotificationDetailComponent.prototype
    ) as any;
    component.router = { navigate };
    component.reviewSyncConflict({ ...base, event: 'general.admin_broadcast' });
    component.reviewSyncConflict({
      ...base,
      event: 'sync.conflict',
      metadata: { entityType: 'expense' },
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renders ordinary security.new_login notifications without a special action route', () => {
    const notification = {
      ...base,
      event: 'security.new_login',
      category: 'security',
      metadata: {
        authenticationMethod: 'password',
        occurredAt: '2026-09-24T12:00:00.000Z',
      },
    };
    const component = Object.create(
      NotificationDetailComponent.prototype
    ) as any;
    component.notification = notification;
    expect(component.canReviewSyncConflict(notification)).toBe(false);
    expect(component.notification.metadata.authenticationMethod).toBe('password');
    expect(component.notification.metadata.occurredAt).toBe(
      '2026-09-24T12:00:00.000Z'
    );
  });

  it('accepts security metadata variants and missing metadata safely', () => {
    const component = Object.create(
      NotificationDetailComponent.prototype
    ) as any;
    for (const authenticationMethod of [
      'google_web',
      'google_native',
      'biometric',
    ]) {
      const notification = {
        ...base,
        event: 'security.new_login',
        category: 'security',
        metadata: { authenticationMethod },
      };
      expect(component.canReviewSyncConflict(notification)).toBe(false);
    }
    expect(
      component.canReviewSyncConflict({
        ...base,
        event: 'security.new_login',
        category: 'security',
      })
    ).toBe(false);
  });
});
