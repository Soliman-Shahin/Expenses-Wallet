import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LocalStorageKeys, User } from 'src/app/modules/auth/models';
import { StorageService } from './storage.service';
import { SecureStorageService } from './secure-storage.service';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly localStorageKeys: LocalStorageKeys = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    userId: 'user-id',
    user: 'user',
    userLang: 'user-lang',
  };

  user$ = new BehaviorSubject<User | null>(null);

  constructor(
    private storage: StorageService,
    private secure: SecureStorageService
  ) {
    const user = this.getUser();
    if (user) this.user$.next(user);
  }

  // Use StorageService for all storage operations
  private getItem<T = string>(key: string): T | null {
    return this.storage.get<T>(key);
  }

  private setItem<T = string>(key: string, value: T): void {
    this.storage.set<T>(key, value);
  }

  private removeItem(key: string): void {
    this.storage.remove(key);
  }

  getAccessToken(): string | null {
    return this.secure.get(this.localStorageKeys.accessToken);
  }

  getRefreshToken(): string | null {
    return this.secure.get(this.localStorageKeys.refreshToken);
  }

  getUserId(): string | null {
    return this.getItem<string>(this.localStorageKeys.userId);
  }

  getUser(): User | null {
    return this.getItem<User>(this.localStorageKeys.user);
  }

  getUserLang(): string | null {
    return this.getItem<string>(this.localStorageKeys.userLang);
  }

  setAccessToken(accessToken: string): void {
    this.secure.set(this.localStorageKeys.accessToken, accessToken);
  }

  setRefreshToken(refreshToken: string): void {
    this.secure.set(this.localStorageKeys.refreshToken, refreshToken);
  }

  setUserId(userId: string): void {
    this.setItem<string>(this.localStorageKeys.userId, userId);
  }

  setUser(user: User): void {
    this.setItem<User>(this.localStorageKeys.user, user);
    this.user$.next(user);
  }

  setUserLang(userLang: string): void {
    this.setItem<string>(this.localStorageKeys.userLang, userLang);
  }

  setSession(userId: string, accessToken: string, refreshToken: string): void {
    this.setUserId(userId);
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  removeSession(): void {
    // Remove user-related keys from normal storage
    [
      this.localStorageKeys.user,
      this.localStorageKeys.userId,
      this.localStorageKeys.userLang,
    ].forEach((key) => this.removeItem(key));
    // Remove tokens from secure storage
    this.secure.remove(this.localStorageKeys.accessToken);
    this.secure.remove(this.localStorageKeys.refreshToken);
    this.user$.next(null);
  }

  getPayload(): any {
    const token = this.getAccessToken();
    if (token) {
      try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload)).data ?? null;
      } catch (error) {
        console.error('Error parsing payload:', error);
        return null;
      }
    }
    return null;
  }

  // Token expiration helpers
  isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      if (!exp) return false;
      return Date.now() / 1000 > exp;
    } catch (e) {
      return true;
    }
  }

  isAccessTokenExpired(): boolean {
    return this.isTokenExpired(this.getAccessToken());
  }

  isRefreshTokenExpired(): boolean {
    return this.isTokenExpired(this.getRefreshToken());
  }
}
