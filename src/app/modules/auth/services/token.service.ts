import { Injectable, signal } from '@angular/core';
import { User } from '../models';
import { StorageService } from './storage.service';
import { SecureStorageService } from './secure-storage.service';
import { Subject } from 'rxjs';

interface Session {
  user: User | null;
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly sessionEnded = new Subject<void>();
  readonly sessionEnded$ = this.sessionEnded.asObservable();
  user = signal<User | null>(null);
  private session: Session = { user: null, accessToken: '', refreshToken: '' };
  private persistent = false;
  private writes: Promise<void> = Promise.resolve();
  private initialization?: Promise<void>;
  private readonly policyKey = 'ewallet_auth_persistent';
  revision = 0;

  constructor(
    private storage: StorageService,
    private secure: SecureStorageService
  ) {}

  initialize(): Promise<void> {
    return (this.initialization ??= this.restore().catch((error) => {
      this.initialization = undefined;
      throw error;
    }));
  }

  private async restore(): Promise<void> {
    const revision = this.revision;
    const policy = localStorage.getItem(this.policyKey);
    if (policy === 'false') return;
    let saved: Session | null = null;
    const raw = await this.secure.read();
    if (raw) saved = JSON.parse(raw);
    // Preserve existing installs once; move credentials out of legacy native localStorage.
    if (!saved && policy === null) {
      const accessToken =
        this.storage.get<string>('secure_access-token') ||
        this.storage.get<string>('ewallet_secure_access-token');
      const refreshToken =
        this.storage.get<string>('secure_refresh-token') ||
        this.storage.get<string>('ewallet_secure_refresh-token');
      const user = this.storage.get<User>('user');
      if (accessToken && refreshToken && user)
        saved = { accessToken, refreshToken, user };
    }
    if (
      revision !== this.revision ||
      !saved?.accessToken ||
      !saved?.refreshToken ||
      !saved?.user
    )
      return;
    this.persistent = true;
    this.session = saved;
    this.user.set(saved.user);
    this.storage.set('user', saved.user);
    await this.persist();
    this.clearLegacy();
  }

  private clearLegacy(): void {
    [
      'secure_access-token',
      'secure_refresh-token',
      'ewallet_secure_access-token',
      'ewallet_secure_refresh-token',
      'user-id',
    ].forEach((k) => this.storage.remove(k));
  }

  async saveSession(
    user: User,
    accessToken: string,
    refreshToken: string,
    persistent: boolean
  ): Promise<void> {
    this.revision++;
    this.persistent = persistent;
    // Preserve the profile cache contract, but never persist password/session fields.
    const {
      password: _password,
      sessions: _sessions,
      ...safeUser
    } = user as User & { password?: unknown; sessions?: unknown };
    user = safeUser as User;
    this.session = { user, accessToken, refreshToken };
    this.storage.set('user', user);
    this.user.set(user);
    await this.persist();
    this.clearLegacy();
  }

  async updateTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.session = { ...this.session, accessToken, refreshToken };
    await this.persist();
  }

  private persist(): Promise<void> {
    const persistent = this.persistent;
    const snapshot = JSON.stringify(this.session);
    localStorage.setItem(this.policyKey, String(persistent));
    const write = this.writes
      .catch(() => undefined)
      .then(() =>
        persistent ? this.secure.write(snapshot) : this.secure.clear()
      );
    this.writes = write;
    return write;
  }

  getAccessToken(): string | null {
    return this.session.accessToken || null;
  }
  getRefreshToken(): string | null {
    return this.session.refreshToken || null;
  }
  getUser(): User | null {
    return this.user();
  }
  getUserId(): string | null {
    return this.user()?._id || null;
  }
  getUserLang(): string | null {
    return this.storage.get<string>('user-lang');
  }
  setUserLang(value: string): void {
    this.storage.set('user-lang', value);
  }
  setUserId(_value: string): void {} // User ID is owned by the session user.
  setUser(user: User): void {
    this.session.user = user;
    this.user.set(user);
    if (this.session.accessToken)
      void this.persist().catch(() =>
        console.warn('Session storage unavailable')
      );
  }
  setAccessToken(value: string): void {
    this.session.accessToken = value;
  }
  setRefreshToken(value: string): void {
    this.session.refreshToken = value;
  }
  setSession(_id: string, accessToken: string, refreshToken: string): void {
    void this.updateTokens(accessToken, refreshToken).catch(() =>
      console.warn('Session storage unavailable')
    );
  }
  removeSession(): void {
    this.revision++;
    this.persistent = false;
    this.session = { user: null, accessToken: '', refreshToken: '' };
    this.user.set(null);
    this.sessionEnded.next();
    this.storage.remove('user');
    this.clearLegacy();
    void this.persist().catch(() =>
      console.warn('Session storage cleanup unavailable')
    );
  }
  async flush(): Promise<void> {
    await this.writes;
  }
  getPayload(): any {
    try {
      return this.decode(this.getAccessToken()!).data ?? null;
    } catch {
      return null;
    }
  }
  private decode(token: string): any {
    return JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
  }
  isTokenExpired(token: string | null): boolean {
    try {
      const exp = this.decode(token!).exp;
      return !exp || Date.now() / 1000 >= exp - 30;
    } catch {
      return true;
    }
  }
  isAccessTokenExpired(): boolean {
    return this.isTokenExpired(this.getAccessToken());
  }
  // Refresh credentials are opaque: only the server can determine expiry/revocation.
  isRefreshTokenExpired(): boolean {
    return !this.getRefreshToken();
  }
}
