import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
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

  constructor(private api: ApiService, private token: TokenService) {}

  load(): Observable<NotificationPreferences> {
    const ownerId = this.token.getUserId();
    return this.api
      .get<{ categories: NotificationPreferences }>(
        '/notifications/preferences'
      )
      .pipe(
        tap((response) => {
          if (ownerId && ownerId === this.token.getUserId()) {
            this.state.next(response.categories);
          }
        }),
        map((response) => response.categories)
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
    return this.api
      .patch<{ categories: NotificationPreferences }>(
        '/notifications/preferences',
        updates
      )
      .pipe(
        tap((response) => {
          if (ownerId && ownerId === this.token.getUserId()) {
            this.state.next(response.categories);
          }
        }),
        map((response) => response.categories)
      );
  }

  get current(): NotificationPreferences {
    return this.state.value ?? DEFAULT_NOTIFICATION_PREFERENCES;
  }

  clearForOwner(): void {
    this.state.next(null);
  }
}
