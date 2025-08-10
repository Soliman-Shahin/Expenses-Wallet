import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

/**
 * SecureStorageService
 *
 * Abstraction layer for storing sensitive data (e.g., tokens).
 * Currently delegates to StorageService with a dedicated secure prefix.
 *
 * NOTE:
 * - This is intentionally designed to be easily replaced with a native secure
 *   implementation (e.g., @capacitor-community/secure-storage) in the future.
 * - Keep the API synchronous to avoid invasive changes across the app.
 */
@Injectable({ providedIn: 'root' })
export class SecureStorageService {
  private readonly prefix = 'ewallet_secure_';

  constructor(private storage: StorageService) {}

  set(key: string, value: string): void {
    this.storage.set<string>(this.prefix + key, value);
  }

  get(key: string): string | null {
    return this.storage.get<string>(this.prefix + key);
  }

  remove(key: string): void {
    this.storage.remove(this.prefix + key);
  }

  clear(): void {
    // Clear only secure-prefixed keys
    try {
      // Access underlying storage via the same mechanism StorageService uses
      // We don't have direct access to the raw Storage instance, so iterate keys from window.localStorage
      const store = window.localStorage;
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (!k) continue;
        if (
          k.startsWith('ewallet_' + this.prefix) ||
          k.startsWith(this.prefix)
        ) {
          keys.push(k);
        }
      }
      keys.forEach((k) => store.removeItem(k));
    } catch (e) {
      console.error('SecureStorage clear error:', e);
    }
  }
}
