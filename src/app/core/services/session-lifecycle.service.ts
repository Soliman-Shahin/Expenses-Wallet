import { Injectable } from '@angular/core';
import { Observable, catchError, from, of, switchMap } from 'rxjs';
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
      catchError(() => of(undefined)),
      switchMap(() => this.authService.logout())
    );
  }
}
