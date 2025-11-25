import { Injectable, inject } from '@angular/core';
import { CanActivateFn, CanLoad, CanMatchFn, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuardService implements CanLoad {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean | UrlTree {
    if (this.auth.isLoggedIn) {
      return true;
    }
    // Redirect to login if not authenticated
    return this.router.parseUrl('/auth/login');
  }

  // Prevent lazy modules from loading when unauthenticated
  canLoad(): boolean | UrlTree {
    if (this.auth.isLoggedIn) {
      return true;
    }
    return this.router.parseUrl('/auth/login');
  }

  // Route matching guard for stand-alone route configurations
  canMatch(): boolean | UrlTree {
    if (this.auth.isLoggedIn) {
      return true;
    }
    return this.router.parseUrl('/auth/login');
  }
}

// Functional guard adapter (Angular 15+)
export const AuthGuard: CanActivateFn = () => {
  return inject(AuthGuardService).canActivate();
};

export const AuthMatchGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
) => {
  return inject(AuthGuardService).canMatch();
};
