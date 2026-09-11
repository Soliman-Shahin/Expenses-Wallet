import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Observable, from, switchMap, throwError, firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/core/services/api.service';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { AuthService } from './auth.service';

interface ProtectedEnrollment {
  deviceId: string;
  credential: string;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class BiometricSignInService {
  private readonly enrollmentServer =
    'com.shahin.expenseswallet.auth.biometric.v1';
  private readonly installationServer =
    'com.shahin.expenseswallet.auth.installation.v1';
  private readonly native = NativeBiometric;
  private readonly biometric = inject(BiometricService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }
  async isAvailable(): Promise<boolean> {
    return this.isNative() && (await this.biometric.isAvailable());
  }

  private async read(server: string): Promise<string | null> {
    if (!this.isNative()) return null;
    try {
      if (!(await this.native.isCredentialsSaved({ server })).isSaved)
        return null;
      return (await this.native.getCredentials({ server })).password || null;
    } catch {
      return null;
    }
  }
  private async write(server: string, value: string): Promise<void> {
    if (!this.isNative())
      throw new Error('Native biometric sign-in unavailable');
    await this.native.setCredentials({
      server,
      username: 'protected',
      password: value,
    });
  }
  private async remove(server: string): Promise<void> {
    if (!this.isNative()) return;
    try {
      await this.native.deleteCredentials({ server });
    } catch {
      /* already absent */
    }
  }

  async getEnrollment(): Promise<ProtectedEnrollment | null> {
    const raw = await this.read(this.enrollmentServer);
    if (!raw) return null;
    try {
      const value = JSON.parse(raw) as ProtectedEnrollment;
      return value.deviceId && value.credential ? value : null;
    } catch {
      return null;
    }
  }
  async hasEnrollment(): Promise<boolean> {
    return !!(await this.getEnrollment());
  }

  async getOrCreateInstallationId(): Promise<string> {
    const existing = await this.read(this.installationServer);
    if (existing) return existing;
    const id = crypto.randomUUID();
    await this.write(this.installationServer, id);
    return id;
  }

  async enroll(
    label: string,
    platform: 'android' | 'ios',
    userId?: string
  ): Promise<void> {
    try {
      if (!(await this.isAvailable())) throw new Error('unavailable');
      if (!(await this.biometric.verifyIdentity('Enable biometric sign-in'))) throw new Error('cancelled');
    } catch {
      throw new Error('Biometric sign-in enrollment failed');
    }
    let deviceId: string;
    try {
      const existing = await this.read(this.installationServer);
      deviceId = existing || this.createInstallationId();
      if (!existing) {
        await this.write(this.installationServer, deviceId);
        if ((await this.read(this.installationServer)) !== deviceId) throw new Error('installation_verify_failed');
      }
    } catch {
      throw new Error('Biometric sign-in enrollment failed');
    }
    let credential: string;
    try {
      const response: any = await firstValueFrom(
        this.api.post('/user/biometric/enroll', { deviceId, label, platform })
      );
      credential = response?.credential;
      if (typeof credential !== 'string' || !credential)
        throw new Error('invalid_response');
    } catch {
      throw new Error('Biometric sign-in enrollment failed');
    }
    try {
      await this.write(
        this.enrollmentServer,
        JSON.stringify({ deviceId, credential, userId })
      );
      if (!(await this.getEnrollment())) throw new Error('credential_verify_failed');
    } catch (error) {
      try {
        await firstValueFrom(
          this.api.delete('/user/biometric/current', {
            body: { deviceId },
          } as any)
        );
      } catch {
        /* best-effort cleanup */
      }
      throw error;
    }
  }

  private createInstallationId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
      12,
      16
    )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  signIn(onVerified?: () => void): Observable<any> {
    if (!this.isNative())
      return throwError(() => new Error('Biometric sign-in unavailable'));
    return from(
      (async () => {
        if (!(await this.isAvailable()))
          throw new Error('Biometric sign-in unavailable');
        if (!(await this.hasEnrollment()))
          throw new Error('Biometric sign-in needs setup again');
        if (!(await this.biometric.verifyIdentity('Sign in with biometrics')))
          throw new Error('Biometric verification cancelled');
        onVerified?.();
        const enrollment = await this.getEnrollment();
        if (!enrollment) throw new Error('Biometric sign-in needs setup again');
        return enrollment;
      })()
    ).pipe(
      switchMap((enrollment) =>
        this.auth.loginWithBiometric(
          enrollment.deviceId,
          enrollment.credential,
          enrollment.userId
        )
      )
    );
  }

  async revoke(): Promise<void> {
    const enrollment = await this.getEnrollment();
    if (enrollment && this.auth.isLoggedIn)
      await firstValueFrom(
        this.api.delete('/user/biometric/current', {
          body: { deviceId: enrollment.deviceId },
        } as any)
      );
    await this.remove(this.enrollmentServer);
  }

  async clearLocalEnrollment(): Promise<void> {
    await this.remove(this.enrollmentServer);
  }
}
