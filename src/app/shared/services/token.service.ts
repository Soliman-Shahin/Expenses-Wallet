import { Injectable } from '@angular/core';
import { User } from '../models';
import { BehaviorSubject, Subject } from 'rxjs';

interface LocalStorageKeys {
  accessToken: string;
  refreshToken: string;
  userId: string;
  user: string;
  userLang: string;
}

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

  userSubject = new Subject<User | null>();

  constructor() {}

  private getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  }

  private setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
    }
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  }

  getAccessToken(): string | null {
    return this.getItem(this.localStorageKeys.accessToken);
  }

  getRefreshToken(): string | null {
    return this.getItem(this.localStorageKeys.refreshToken);
  }

  getUserId(): string | null {
    return this.getItem(this.localStorageKeys.userId);
  }

  getUser(): User | null {
    const userJson = this.getItem(this.localStorageKeys.user);
    return userJson ? JSON.parse(userJson) : null;
  }

  getUserLang(): string | null {
    return this.getItem(this.localStorageKeys.userLang);
  }

  setAccessToken(accessToken: string): void {
    this.setItem(this.localStorageKeys.accessToken, accessToken);
  }

  setRefreshToken(refreshToken: string): void {
    this.setItem(this.localStorageKeys.refreshToken, refreshToken);
  }

  setUserId(userId: string): void {
    this.setItem(this.localStorageKeys.userId, userId);
  }

  setUser(user: User): void {
    this.setItem(this.localStorageKeys.user, JSON.stringify(user));
    this.userSubject.next(user);
  }

  setUserLang(userLang: string): void {
    this.setItem(this.localStorageKeys.userLang, userLang);
  }

  setSession(userId: string, accessToken: string, refreshToken: string): void {
    this.setUserId(userId);
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  removeSession(): void {
    Object.values(this.localStorageKeys).forEach((key) => this.removeItem(key));
    this.userSubject.next(null);
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
}
