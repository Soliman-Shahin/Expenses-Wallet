import { Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  from,
  of,
  switchMap,
  timeout,
  shareReplay,
  tap,
} from 'rxjs';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationService } from './notification.service';
import { NotificationPreferenceService } from './notification-preference.service';

/** Coordinates cross-cutting session teardown without coupling AuthService to push. */
@Injectable({ providedIn: 'root' })
export class SessionLifecycleService {
  constructor(
    private authService: AuthService,
    private pushNotificationService: PushNotificationService,
    private notificationService?: NotificationService,
    private notificationPreferenceService?: NotificationPreferenceService
  ) {}

  logout(): Observable<void> {
    return from(this.pushNotificationService.deactivateCurrentDevice()).pipe(
      // Auxiliary teardown must not prevent explicit authentication logout.
      timeout(3000),
      catchError(() => of(undefined)),
      tap(() => {
        this.notificationService?.clearForOwner();
        this.notificationPreferenceService?.clearForOwner();
      }),
      switchMap(() => this.authService.logout()),
      // Once requested, logout must survive the initiating view's destruction.
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }
}
