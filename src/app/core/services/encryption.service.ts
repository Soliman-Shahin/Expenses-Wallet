import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private key = environment.encryptionKey;

  constructor() {}

  encrypt(data: any, key?: string): string {
    if (!data) return '';
    try {
      return CryptoJS.AES.encrypt(
        JSON.stringify(data),
        key || this.key
      ).toString();
    } catch (e) {
      console.error('Encryption failed', e);
      return '';
    }
  }

  decrypt(ciphertext: string, key?: string, isObject: boolean = true): any {
    if (!ciphertext) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key || this.key);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return isObject ? JSON.parse(decryptedData) : decryptedData;
    } catch (e) {
      console.error('Decryption failed', e);
      return null;
    }
  }
}
