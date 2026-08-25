import { Injectable, signal } from '@angular/core';
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

  user = signal<User | null>(null);

  constructor(
    private storage: StorageService,
    private secure: SecureStorageService
  ) {
    // Migrate old tokens if they exist
    this.migrateOldTokens();
    // Initialize user signal from storage on app start
    this.initializeUserFromStorage();
  }

  /**
   * Migrate tokens from old storage format to new format
   * Old format: 'ewallet_ewallet_secure_access-token'
   * New format: 'ewallet_secure_access-token'
   */
  private migrateOldTokens(): void {
    try {
      const oldAccessTokenKey = 'ewallet_ewallet_secure_access-token';
      const oldRefreshTokenKey = 'ewallet_ewallet_secure_refresh-token';
      
      const oldAccessToken = localStorage.getItem(oldAccessTokenKey);
      const oldRefreshToken = localStorage.getItem(oldRefreshTokenKey);
      
      if (oldAccessToken) {
        console.log('🔄 [TokenService] Migrating old access token...');
        this.setAccessToken(JSON.parse(oldAccessToken));
        localStorage.removeItem(oldAccessTokenKey);
      }
      
      if (oldRefreshToken) {
        console.log('🔄 [TokenService] Migrating old refresh token...');
        this.setRefreshToken(JSON.parse(oldRefreshToken));
        localStorage.removeItem(oldRefreshTokenKey);
      }
    } catch (error) {
      console.warn('⚠️ [TokenService] Token migration failed:', error);
    }
  }

  /**
   * Initialize user signal from storage
   * This ensures authentication state persists across page reloads
   */
  private initializeUserFromStorage(): void {
    try {
      const storedUser = this.getUser();
      const accessToken = this.getAccessToken();
      
      console.log('🔍 [TokenService] Checking stored auth state:', {
        hasUser: !!storedUser,
        hasToken: !!accessToken,
        tokenLength: accessToken?.length || 0
      });
      
      // Only restore user if we have both user data and a valid token
      if (storedUser && accessToken) {
        // Check if token is expired
        if (!this.isTokenExpired(accessToken)) {
          this.user.set(storedUser);
          console.log('✅ [TokenService] User state restored from storage');
        } else {
          // Token expired, clear invalid session
          console.warn('⚠️ [TokenService] Token expired, clearing session');
          this.removeSession();
        }
      } else {
        console.warn('⚠️ [TokenService] No valid session found in storage');
      }
    } catch (error) {
      console.error('❌ [TokenService] Failed to initialize user from storage:', error);
      // Clear potentially corrupted data
      this.removeSession();
    }
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
    this.user.set(user);
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
    this.user.set(null);
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
      const parts = token.split('.');
      if (parts.length !== 3) return true; // Invalid JWT format
      
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      
      // If no expiration, consider token valid (some tokens don't expire)
      if (!exp) return false;
      
      // Add 30 second buffer to account for clock skew
      const currentTime = Math.floor(Date.now() / 1000);
      return currentTime > (exp - 30);
    } catch (e) {
      console.error('Error checking token expiration:', e);
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
