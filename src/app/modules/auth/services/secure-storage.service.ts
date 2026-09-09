import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

/** Native protected storage; web localStorage is persistence, not secure storage. */
@Injectable({ providedIn: 'root' })
export class SecureStorageService {
  private native = NativeBiometric;
  private readonly key = 'ewallet_auth_session_v1';
  private readonly server = 'com.shahin.expenseswallet.auth.session.v1';

  async read(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) return localStorage.getItem(this.key);
    if (
      !(await this.native.isCredentialsSaved({ server: this.server })).isSaved
    )
      return null;
    // The plugin field is named password; its value is a session bundle, never a user password.
    return (await this.native.getCredentials({ server: this.server })).password;
  }

  async write(value: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      localStorage.setItem(this.key, value);
      return;
    }
    await this.native.setCredentials({
      server: this.server,
      username: 'session',
      password: value,
    });
    localStorage.removeItem(this.key);
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key);
    if (Capacitor.isNativePlatform())
      await this.native.deleteCredentials({ server: this.server });
  }
}
