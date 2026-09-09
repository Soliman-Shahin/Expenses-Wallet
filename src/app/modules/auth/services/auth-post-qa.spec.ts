import { Component } from '@angular/core';
import {
  TestBed,
  fakeAsync,
  flushMicrotasks,
  tick,
} from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Subject, finalize, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SecureStorageService } from './secure-storage.service';
import { StorageService } from './storage.service';
import { ProfileService } from '../../profile/services/profile.service';
import { LoginComponent } from '../components/login/login.component';
import { authInterceptor } from '../helper/authInterceptor';
import { errorInterceptor } from '../../../core/interceptors/error.interceptor';
import { ConnectionService } from '../../../core/services/connection.service';
import { LoadingService } from '../../../core/services/loading.service';
import { SessionLifecycleService } from '../../../core/services/session-lifecycle.service';
import { ComponentStateService } from '../../../shared/services/component-state.service';
import { BaseComponent } from '../../../shared/base/base.component';
import { environment } from 'src/environments/environment';

@Component({ standalone: true, template: 'Login' })
class LoginDestination {}

describe('AUTH.1 post-QA regressions', () => {
  let auth: AuthService;
  let tokens: TokenService;
  let requests: HttpTestingController;
  let state: ComponentStateService;
  let loader: LoadingService;
  let router: Router;
  let online: boolean;
  let toast: jasmine.Spy;
  const user = { _id: 'post-qa-user', email: 'postqa@example.test' } as any;
  const payload = () => ({
    user,
    accessToken:
      'header.' +
      btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) +
      '.signature',
    refreshToken: 'synthetic-refresh',
  });
  const url = (path: string) => environment.apiUrl + path;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    online = true;
    spyOn(console, 'log');
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);
    toast = jasmine.createSpy().and.resolveTo({ present: async () => {} });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'home', component: LoginDestination },
          { path: 'auth/login', component: LoginDestination },
        ]),
        provideHttpClient(
          withInterceptors([errorInterceptor, authInterceptor])
        ),
        provideHttpClientTesting(),
        { provide: ToastController, useValue: { create: toast } },
        {
          provide: ConnectionService,
          useValue: {
            isOnline: () => online,
            isBackendReachable: () => online,
          },
        },
      ],
    });
    auth = TestBed.inject(AuthService);
    tokens = TestBed.inject(TokenService);
    requests = TestBed.inject(HttpTestingController);
    state = TestBed.inject(ComponentStateService);
    loader = TestBed.inject(LoadingService);
    router = TestBed.inject(Router);
  });
  afterEach(() => {
    requests.verify();
    loader.clearAll();
    localStorage.clear();
    sessionStorage.clear();
  });
  function seed() {
    const p = payload();
    void tokens.saveSession(user, p.accessToken, p.refreshToken, true);
    flushMicrotasks();
  }
  function coldSession() {
    const cold = new TokenService(
      new StorageService(),
      TestBed.inject(SecureStorageService)
    );
    void cold.initialize();
    flushMicrotasks();
    return cold;
  }

  it('balances repeated reactive loading updates and navigation cleanup', fakeAsync(() => {
    state.setLoading(true);
    state.setLoading(true);
    tick(151);
    expect(loader.isLoading).toBeTrue();
    state.setLoading(false);
    expect(loader.isLoading).toBeFalse();
    state.setLoading(true);
    void router.navigateByUrl('/auth/login');
    flushMicrotasks();
    tick(151);
    expect(router.url).toBe('/auth/login');
    expect(state.loading()).toBeFalse();
    expect(loader.isLoading).toBeFalse();
  }));

  for (const fails of [false, true]) {
    it(
      'finishes web logout and profile cancellation when revoke ' +
        (fails ? 'fails' : 'succeeds'),
      fakeAsync(() => {
        seed();
        void router.navigateByUrl('/home');
        flushMicrotasks();
        const profile = TestBed.inject(ProfileService);
        // Reproduce Home's still-subscribed, synchronous profile-clear reaction.
        const reactive = profile.profile$
          .pipe(
            switchMap((value) => (value ? of(value) : profile.fetchProfile()))
          )
          .subscribe();
        let finished = false;
        profile
          .fetchProfile()
          .pipe(finalize(() => (finished = true)))
          .subscribe();
        const pending = requests.match(url('/user/me'));
        expect(pending.length).toBe(2);
        const logoutCaller: any = Object.create(BaseComponent.prototype);
        logoutCaller.state = state;
        logoutCaller.destroy$ = new Subject<void>();
        logoutCaller.sessionLifecycleService = new SessionLifecycleService(
          auth,
          {
            deactivateCurrentDevice: async () => {},
          } as any
        );
        logoutCaller.logOut();
        flushMicrotasks();
        state.setLoading(true); // The Home view model echoes the global state.
        tick(151);
        const revoke = requests.expectOne(url('/user/logout'));
        revoke.flush(
          {},
          fails ? { status: 503, statusText: 'Unavailable' } : undefined
        );
        flushMicrotasks();
        tick(151);
        expect(pending.every((request) => request.cancelled)).toBeTrue();
        expect(finished).toBeTrue();
        requests.expectNone(url('/user/me'));
        expect(router.url).toBe('/auth/login');
        expect(auth.isLoggedIn).toBeFalse();
        expect(loader.isLoading).toBeFalse();
        expect((loader as any).loadingSignal()).toBeFalse();
        expect(coldSession().getRefreshToken()).toBeNull();
        reactive.unsubscribe();
      })
    );
  }

  it('checks session at subscription time and cannot fetch after auth clear', fakeAsync(() => {
    seed();
    const profile = TestBed.inject(ProfileService);
    const delayed = profile.fetchProfile();
    tokens.removeSession();
    let complete = false;
    delayed.subscribe({ complete: () => (complete = true) });
    expect(complete).toBeTrue();
    profile.clearProfile();
    profile.fetchProfile().subscribe();
    requests.expectNone(url('/user/me'));
    flushMicrotasks();
  }));

  it('releases profile work when its view subscription is cancelled', fakeAsync(() => {
    seed();
    const sub = TestBed.inject(ProfileService).fetchProfile().subscribe();
    const pending = requests.expectOne(url('/user/me'));
    sub.unsubscribe();
    expect(pending.cancelled).toBeTrue();
  }));

  it('logout survives caller destruction during auxiliary teardown', fakeAsync(() => {
    seed();
    let release!: () => void;
    const lifecycle = new SessionLifecycleService(auth, {
      deactivateCurrentDevice: () =>
        new Promise<void>((resolve) => (release = resolve)),
    } as any);
    const caller: any = Object.create(BaseComponent.prototype);
    caller.state = state;
    caller.destroy$ = new Subject<void>();
    caller.sessionLifecycleService = lifecycle;
    caller.logOut();
    caller.destroy$.next();
    expect(loader.isLoading).toBeFalse();
    release();
    flushMicrotasks();
    requests.expectOne(url('/user/logout')).flush({});
    flushMicrotasks();
    expect(router.url).toBe('/auth/login');
    expect(tokens.getRefreshToken()).toBeNull();
  }));

  for (const remember of [false, true]) {
    it(
      'Google callback persists despite password Remember Me = ' + remember,
      fakeAsync(() => {
        sessionStorage.setItem('ewallet_oauth_persistent', String(remember));
        auth.handleOAuthCallback(payload()).subscribe();
        flushMicrotasks();
        expect(coldSession().getRefreshToken()).toBe('synthetic-refresh');
      })
    );

    it(
      'native Google persists with password Remember Me = ' + remember,
      fakeAsync(() => {
        spyOn(Capacitor, 'getPlatform').and.returnValue('android');
        spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
        const secure = TestBed.inject(SecureStorageService);
        let saved: string | null = null;
        spyOn(secure, 'write').and.callFake(async (value) => {
          saved = value;
        });
        spyOn(secure, 'read').and.callFake(async () => saved);
        spyOn(secure, 'clear').and.callFake(async () => {
          saved = null;
        });
        const previous = (window as any).GoogleAuth;
        (window as any).GoogleAuth = {
          signIn: async () => ({ idToken: 'synthetic-google-token' }),
        };
        try {
          const login: any = Object.create(LoginComponent.prototype);
          login.authService = auth;
          login.formFields = { rememberMe: 'rememberMe' };
          login.loginForm = { get: () => ({ value: remember }) };
          login.handleAuth = (result: any) => result.subscribe();
          login.signInWithGoogle();
          flushMicrotasks();
          requests
            .expectOne(url('/user/auth/google/native'))
            .flush({ data: payload() });
          flushMicrotasks();
          expect(saved).not.toBeNull();
          expect(coldSession().getRefreshToken()).toBe('synthetic-refresh');
        } finally {
          (window as any).GoogleAuth = previous;
        }
      })
    );

    it(
      'password login preserves Remember Me = ' + remember,
      fakeAsync(() => {
        auth.login(user.email, 'synthetic-password', remember).subscribe();
        requests.expectOne(url('/user/login')).flush({ data: payload() });
        flushMicrotasks();
        expect(auth.isLoggedIn).toBeTrue();
        expect(coldSession().getRefreshToken()).toBe(
          remember ? 'synthetic-refresh' : null
        );
      })
    );
  }

  it('offline navigation propagates failures without repetitive server toasts or session loss', fakeAsync(() => {
    seed();
    online = false;
    for (const status of [503, 504, 500, 0]) {
      let failed = false;
      TestBed.inject(HttpClient)
        .get(url('/expenses'))
        .subscribe({ error: () => (failed = true) });
      const request = requests.expectOne(url('/expenses'));
      if (status === 0) request.error(new ProgressEvent('error'));
      else request.flush({}, { status, statusText: 'Unavailable' });
      flushMicrotasks();
      expect(failed).toBeTrue();
    }
    expect(toast).not.toHaveBeenCalled();
    expect(auth.isLoggedIn).toBeTrue();
  }));

  it('online network failure is distinguished from a real server error', fakeAsync(() => {
    const http = TestBed.inject(HttpClient);
    http.get(url('/expenses')).subscribe({ error: () => {} });
    requests.expectOne(url('/expenses')).error(new ProgressEvent('error'));
    flushMicrotasks();
    expect(toast.calls.mostRecent().args[0].message).toContain(
      'No internet connection'
    );
    http.get(url('/expenses')).subscribe({ error: () => {} });
    requests
      .expectOne(url('/expenses'))
      .flush({}, { status: 500, statusText: 'Server error' });
    flushMicrotasks();
    expect(toast.calls.mostRecent().args[0].message).toBe(
      'Server error. Please try again later.'
    );
  }));
});
