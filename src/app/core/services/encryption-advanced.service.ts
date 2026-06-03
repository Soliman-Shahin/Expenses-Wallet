import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Advanced Encryption Service using AES-256-GCM
 * Compatible with backend encryption-advanced.ts
 *
 * Uses Web Crypto API (native browser support)
 * Format: iv:authTag:encryptedData (all base64)
 */
@Injectable({
  providedIn: 'root',
})
export class EncryptionAdvancedService {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 16; // 16 bytes = 128 bits
  private readonly TAG_LENGTH = 128; // 128 bits = 16 bytes
  private encryptionKey: CryptoKey | null = null;

  constructor() {
    this.initializeKey();
  }

  /**
   * Initialize encryption key
   * NOTE: This is a temporary transport key. In production, implement proper key exchange.
   */
  private async initializeKey(): Promise<void> {
    try {
      // TODO: Implement secure key exchange protocol with backend
      const keyString = 'TEMP_TRANSPORT_KEY_FOR_EXCHANGE';

      // Derive key using PBKDF2 (same as backend scrypt concept)
      const keyMaterial = await this.getKeyMaterial(keyString);
      this.encryptionKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('expenses-wallet-salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        {
          name: this.ALGORITHM,
          length: this.KEY_LENGTH,
        },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('❌ Failed to initialize encryption key:', error);
    }
  }

  /**
   * Get key material from password
   */
  private async getKeyMaterial(password: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
  }

  /**
   * Encrypt data using AES-256-GCM
   * Returns format: iv:authTag:encryptedData (base64)
   */
  async encrypt(data: any): Promise<string> {
    if (!data) return '';

    try {
      // Wait for key initialization if not ready
      if (!this.encryptionKey) {
        await this.initializeKey();
      }

      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized');
      }

      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Convert data to JSON string then to ArrayBuffer
      const jsonData = JSON.stringify(data);
      const encodedData = new TextEncoder().encode(jsonData);

      // Encrypt
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
          tagLength: this.TAG_LENGTH,
        },
        this.encryptionKey,
        encodedData
      );

      // Extract encrypted data and auth tag
      // In AES-GCM, the auth tag is appended at the end
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const tagLength = this.TAG_LENGTH / 8; // Convert bits to bytes

      const encrypted = encryptedArray.slice(
        0,
        encryptedArray.length - tagLength
      );
      const authTag = encryptedArray.slice(encryptedArray.length - tagLength);

      // Convert to base64
      const ivBase64 = this.arrayBufferToBase64(iv);
      const authTagBase64 = this.arrayBufferToBase64(authTag);
      const encryptedBase64 = this.arrayBufferToBase64(encrypted);

      // Return in format: iv:authTag:encrypted
      return `${ivBase64}:${authTagBase64}:${encryptedBase64}`;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * Expects format: iv:authTag:encryptedData (base64)
   */
  async decrypt(encryptedData: string): Promise<any> {
    if (!encryptedData) return null;

    try {
      // Wait for key initialization if not ready
      if (!this.encryptionKey) {
        await this.initializeKey();
      }

      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized');
      }

      // Split the encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = this.base64ToArrayBuffer(parts[0]);
      const authTag = this.base64ToArrayBuffer(parts[1]);
      const encrypted = this.base64ToArrayBuffer(parts[2]);

      // Combine encrypted data with auth tag (GCM expects them together)
      const combined = new Uint8Array(
        encrypted.byteLength + authTag.byteLength
      );
      combined.set(new Uint8Array(encrypted), 0);
      combined.set(new Uint8Array(authTag), encrypted.byteLength);

      // Decrypt
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: new Uint8Array(iv),
          tagLength: this.TAG_LENGTH,
        },
        this.encryptionKey,
        combined
      );

      // Convert back to string and parse JSON
      const decryptedData = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return null;
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes =
      buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Check if encryption is enabled
   */
  isEncryptionEnabled(): boolean {
    return environment.enableEncryption !== false; // Default to true
  }

  /**
   * Recursively encrypt specific fields in an object
   */
  async encryptFieldsDeep(obj: any, fieldsToEncrypt: string[]): Promise<any> {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return Promise.all(
        obj.map((item) => this.encryptFieldsDeep(item, fieldsToEncrypt))
      );
    }

    const result = { ...obj };

    for (const key of Object.keys(result)) {
      if (fieldsToEncrypt.includes(key)) {
        const value = result[key];
        if (
          value !== undefined &&
          value !== null &&
          typeof value !== 'string'
        ) {
          result[key] = await this.encrypt(value);
        } else if (typeof value === 'string' && !value.includes(':')) {
          result[key] = await this.encrypt(value);
        }
      } else if (typeof result[key] === 'object') {
        result[key] = await this.encryptFieldsDeep(
          result[key],
          fieldsToEncrypt
        );
      }
    }

    return result;
  }

  /**
   * Recursively decrypt specific fields in an object
   */
  async decryptFieldsDeep(obj: any, fieldsToDecrypt: string[]): Promise<any> {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return Promise.all(
        obj.map((item) => this.decryptFieldsDeep(item, fieldsToDecrypt))
      );
    }

    const result = { ...obj };

    for (const key of Object.keys(result)) {
      if (fieldsToDecrypt.includes(key)) {
        const value = result[key];
        if (typeof value === 'string' && value.includes(':')) {
          const decrypted = await this.decrypt(value);
          if (decrypted !== null) {
            result[key] = decrypted;
          }
        }
      } else if (typeof result[key] === 'object') {
        result[key] = await this.decryptFieldsDeep(
          result[key],
          fieldsToDecrypt
        );
      }
    }

    return result;
  }
}
