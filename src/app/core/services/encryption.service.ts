import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  // NOTE: This service is used for client-side encryption of request/response data
  // The encryption key must match the backend's ENCRYPTION_KEY or fallback
  // Using TEMP_TRANSPORT_KEY to match backend fallback
  private readonly TRANSPORT_KEY = 'TEMP_TRANSPORT_KEY'; // Matches backend fallback

  constructor() {}

  encrypt(data: any, key?: string): string {
    if (!data) return '';
    try {
      return CryptoJS.AES.encrypt(
        JSON.stringify(data),
        key || this.TRANSPORT_KEY
      ).toString();
    } catch (e) {
      console.error('Encryption failed', e);
      return '';
    }
  }

  decrypt(ciphertext: string, key?: string, isObject: boolean = true): any {
    if (!ciphertext) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key || this.TRANSPORT_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return isObject ? JSON.parse(decryptedData) : decryptedData;
    } catch (e) {
      console.error('Decryption failed', e);
      return null;
    }
  }
}
