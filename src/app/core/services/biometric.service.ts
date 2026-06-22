import { Injectable } from '@angular/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Platform } from '@ionic/angular';
import { StorageService } from '../../modules/auth/services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class BiometricService {
  private readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  public lastBiometricTime = 0;

  constructor(private platform: Platform, private storage: StorageService) {}

  get isEnabled(): boolean {
    return !!this.storage.get(this.BIOMETRIC_ENABLED_KEY);
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.storage.set(this.BIOMETRIC_ENABLED_KEY, enabled);
  }

  async isAvailable(): Promise<boolean> {
    if (!this.platform.is('capacitor')) {
      // Mock availability for web testing
      return true;
    }
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch (e) {
      console.error('Biometric availability check failed', e);
      return false;
    }
  }

  async verifyIdentity(
    reason: string = 'Please authenticate to continue'
  ): Promise<boolean> {
    if (!this.platform.is('capacitor')) {
      // Simulate biometric prompt on web
      return new Promise((resolve) => {
        const confirmed = window.confirm(
          `[Web Simulation] Biometric Scan Required\n\n${reason}\n\nClick OK to simulate a successful fingerprint/face scan.`
        );
        resolve(confirmed);
      });
    }

    try {
      const result = await NativeBiometric.verifyIdentity({
        reason: reason,
        title: 'Authentication Required',
        subtitle: 'Log in with your biometric',
        description: reason,
      });
      this.lastBiometricTime = Date.now();
      return true;
    } catch (e) {
      console.error('Biometric verification failed', e);
      this.lastBiometricTime = Date.now();
      return false;
    }
  }

  async setCredentials(
    username: string,
    password: string,
    server: string
  ): Promise<void> {
    if (!this.platform.is('capacitor')) return;
    await NativeBiometric.setCredentials({
      username,
      password,
      server,
    });
  }

  async getCredentials(server: string): Promise<any> {
    if (!this.platform.is('capacitor')) return null;
    try {
      return await NativeBiometric.getCredentials({
        server,
      });
    } catch (e) {
      return null;
    }
  }

  async deleteCredentials(server: string): Promise<void> {
    if (!this.platform.is('capacitor')) return;
    await NativeBiometric.deleteCredentials({
      server,
    });
  }
}
