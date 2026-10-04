import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  defer,
  from,
  map,
  switchMap,
  tap,
  finalize,
  throwError,
} from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from '../../modules/auth/services/token.service';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationCategory,
  NotificationChannel,
  NotificationPreferences,
} from '../models/notification-preference.model';

@Injectable({ providedIn: 'root' })
export class NotificationPreferenceService {
  private readonly state = new BehaviorSubject<NotificationPreferences | null>(
    null
  );
  readonly preferences$ = this.state.asObservable();
  private readonly loadStateSubject = new BehaviorSubject<
    'idle' | 'loading' | 'loaded' | 'error'
  >('idle');
  readonly loadState$ = this.loadStateSubject.asObservable();
  private readonly fieldTails = new Map<string, Promise<void>>();

  constructor(private api: ApiService, private token: TokenService) {}

  load(): Observable<NotificationPreferences> {
    const ownerId = this.token.getUserId();
    this.loadStateSubject.next('loading');
    return this.api
      .get<{ categories: NotificationPreferences }>(
        '/notifications/preferences'
      )
      .pipe(
        tap((response) => {
          if (ownerId && ownerId === this.token.getUserId()) {
            this.state.next(response.categories);
            this.loadStateSubject.next('loaded');
          }
        }),
        map((response) => response.categories),
        tap({
          error: () => {
            if (ownerId && ownerId === this.token.getUserId()) {
              this.loadStateSubject.next('error');
            }
          },
        })
      );
  }

  update(
    updates: Partial<
      Record<
        NotificationCategory,
        Partial<Record<NotificationChannel, boolean>>
      >
    >
  ): Observable<NotificationPreferences> {
    const ownerId = this.token.getUserId();
    const fields = Object.entries(updates).flatMap(([category, channels]) =>
      Object.keys(channels ?? {}).map((channel) => `${category}.${channel}`)
    );
    const queueOwner = ownerId ?? 'unauthenticated';
    const previous = fields.map(
      (field) =>
        this.fieldTails.get(`${queueOwner}:${field}`) ?? Promise.resolve()
    );
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queueKeys = fields.map((field) => `${queueOwner}:${field}`);
    queueKeys.forEach((key) => this.fieldTails.set(key, current));

    return defer(() => from(Promise.all(previous))).pipe(
      switchMap(() =>
        ownerId !== this.token.getUserId()
          ? throwError(() => new Error('PREFERENCE_OWNER_CHANGED'))
          : this.api.patch<{ categories: NotificationPreferences }>(
              '/notifications/preferences',
              updates
            )
      ),
      tap((response) => {
        if (ownerId && ownerId === this.token.getUserId()) {
          const merged = { ...this.current };
          for (const [category, channels] of Object.entries(updates)) {
            if (!channels) continue;
            merged[category as NotificationCategory] = {
              ...merged[category as NotificationCategory],
              ...Object.fromEntries(
                Object.keys(channels).map((channel) => [
                  channel,
                  response.categories[category as NotificationCategory][
                    channel as NotificationChannel
                  ],
                ])
              ),
            };
          }
          this.state.next(merged);
        }
      }),
      map((response) => response.categories),
      finalize(() => {
        release();
        queueKeys.forEach((key) => {
          if (this.fieldTails.get(key) === current) {
            this.fieldTails.delete(key);
          }
        });
      })
    );
  }

  get current(): NotificationPreferences {
    return this.state.value ?? DEFAULT_NOTIFICATION_PREFERENCES;
  }

  clearForOwner(): void {
    this.state.next(null);
    this.loadStateSubject.next('idle');
  }
}
