import { Injectable } from '@angular/core';

export type StorageType = 'local' | 'session';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private prefix = 'ewallet_';
  private storage: Storage;

  constructor() {
    this.storage = localStorage;
  }

  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  setStorage(type: StorageType): void {
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  set<T>(key: string, value: T): void {
    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error('StorageService set error:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(this.prefix + key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error('StorageService get error:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      this.storage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('StorageService remove error:', error);
    }
  }

  clear(): void {
    try {
      // Only clear keys with our prefix
      Object.keys(this.storage)
        .filter((k) => k.startsWith(this.prefix))
        .forEach((k) => this.storage.removeItem(k));
    } catch (error) {
      console.error('StorageService clear error:', error);
    }
  }
}
