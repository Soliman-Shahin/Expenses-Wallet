import { Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  from,
  of,
  switchMap,
  timeout,
  shareReplay,
} from 'rxjs';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { PushNotificationService } from './push-notification.service';

/** Coordinates cross-cutting session teardown without coupling AuthService to push. */
@Injectable({ providedIn: 'root' })
export class SessionLifecycleService {
  constructor(
    private authService: AuthService,
    private pushNotificationService: PushNotificationService
  ) {}

  logout(): Observable<void> {
    return from(this.pushNotificationService.deactivateCurrentDevice()).pipe(
      // Auxiliary teardown must not prevent explicit authentication logout.
      timeout(3000),
      catchError(() => of(undefined)),
      switchMap(() => this.authService.logout()),
      // Once requested, logout must survive the initiating view's destruction.
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }
}
