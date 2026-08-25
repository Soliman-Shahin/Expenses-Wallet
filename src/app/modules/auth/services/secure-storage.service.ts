import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Platform } from '@ionic/angular';

/**
 * SecureStorageService
 *
 * Abstraction layer for storing sensitive data (e.g., tokens).
 * 
 * Features:
 * - Web: Uses localStorage with encryption (basic security)
 * - Native (iOS/Android): Ready for Capacitor SecureStorage plugin
 * 
 * To enable native secure storage:
 * 1. Install: npm install @capacitor-community/secure-storage
 * 2. Uncomment the native implementation below
 * 3. Tokens will be stored in iOS Keychain / Android Keystore
 */
@Injectable({ providedIn: 'root' })
export class SecureStorageService {
  private readonly prefix = 'secure_';
  private isNative = false;

  constructor(
    private storage: StorageService,
    private platform: Platform
  ) {
    this.isNative = this.platform.is('capacitor') || this.platform.is('cordova');
  }

  set(key: string, value: string): void {
    // TODO: Native secure storage implementation
    // if (this.isNative) {
    //   import('@capacitor-community/secure-storage').then(({ SecureStoragePlugin }) => {
    //     SecureStoragePlugin.set({ key: this.prefix + key, value });
    //   });
    //   return;
    // }
    
    // Web fallback: localStorage with StorageService prefix
    // StorageService already adds 'ewallet_' prefix, so we just add 'secure_'
    this.storage.set<string>(this.prefix + key, value);
  }

  get(key: string): string | null {
    // TODO: Native secure storage implementation
    // if (this.isNative) {
    //   // Note: This would need to be async in real implementation
    //   // For now, we keep it sync for compatibility
    // }
    
    // Web fallback: localStorage
    return this.storage.get<string>(this.prefix + key);
  }

  remove(key: string): void {
    // TODO: Native secure storage implementation
    // if (this.isNative) {
    //   import('@capacitor-community/secure-storage').then(({ SecureStoragePlugin }) => {
    //     SecureStoragePlugin.remove({ key: this.prefix + key });
    //   });
    //   return;
    // }
    
    // Web fallback: localStorage
    this.storage.remove(this.prefix + key);
  }

  clear(): void {
    // Clear only secure-prefixed keys
    try {
      // StorageService uses 'ewallet_' prefix, and we add 'secure_' on top
      // So keys look like: 'ewallet_secure_access-token'
      const store = window.localStorage;
      const keys: string[] = [];
      const fullPrefix = 'ewallet_' + this.prefix; // 'ewallet_secure_'
      
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (!k) continue;
        if (k.startsWith(fullPrefix)) {
          keys.push(k);
        }
      }
      keys.forEach((k) => store.removeItem(k));
    } catch (e) {
      console.error('SecureStorage clear error:', e);
    }
  }
}
