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
});
