import { Injectable } from '@angular/core';

/**
 * Encryption Service using Web Crypto API
 * Provides AES-GCM encryption/decryption for sensitive data
 */
@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12; // 96 bits for GCM
  private readonly SALT_LENGTH = 16;
  private readonly ITERATIONS = 100000;

  // Storage key for encryption key
  private readonly ENCRYPTION_KEY_STORAGE = 'enc_key_material';

  constructor() {}

  /**
   * Initialize or retrieve encryption key
   * Keys are derived from a user password or generated randomly
   */
  private async getOrCreateKey(password?: string): Promise<CryptoKey> {
    let keyMaterial: ArrayBuffer;

    if (password) {
      // Derive key from password using PBKDF2
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);

      // Get or create salt
      let salt = this.getSalt();
      if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
        this.saveSalt(salt);
      }

      const importedKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt as any,
          iterations: this.ITERATIONS,
          hash: 'SHA-256',
        },
        importedKey,
        { name: this.ALGORITHM, length: this.KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
      );
    } else {
      // Use stored key or generate new one
      const storedKey = localStorage.getItem(this.ENCRYPTION_KEY_STORAGE);

      if (storedKey) {
        keyMaterial = this.base64ToArrayBuffer(storedKey);
        return await crypto.subtle.importKey(
          'raw',
          keyMaterial,
          this.ALGORITHM,
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        const key = await crypto.subtle.generateKey(
          { name: this.ALGORITHM, length: this.KEY_LENGTH },
          true,
          ['encrypt', 'decrypt']
        );

        // Export and store key
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        localStorage.setItem(
          this.ENCRYPTION_KEY_STORAGE,
          this.arrayBufferToBase64(exportedKey)
        );

        return key;
      }
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encrypt(data: any, password?: string): Promise<string> {
    try {
      const key = await this.getOrCreateKey(password);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Convert data to string and encode
      const encoder = new TextEncoder();
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const encodedData = encoder.encode(dataString);

      // Encrypt
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Return as base64
      return this.arrayBufferToBase64(combined.buffer);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt encrypted data
   */
  async decrypt<T = any>(
    encryptedData: string,
    password?: string,
    parseJson: boolean = true
  ): Promise<T> {
    try {
      const key = await this.getOrCreateKey(password);

      // Decode base64
      const combined = new Uint8Array(this.base64ToArrayBuffer(encryptedData));

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.IV_LENGTH);
      const data = combined.slice(this.IV_LENGTH);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        data
      );

      // Decode to string
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedData);

      // Parse JSON if requested
      if (parseJson) {
        try {
          return JSON.parse(decryptedString) as T;
        } catch {
          return decryptedString as any;
        }
      }

      return decryptedString as any;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Generate a random encryption key for backups
   */
  async generateBackupKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exportedKey);
  }

  /**
   * Encrypt data with a specific key
   */
  async encryptWithKey(data: any, keyBase64: string): Promise<string> {
    const keyBuffer = this.base64ToArrayBuffer(keyBase64);
    const key = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      this.ALGORITHM,
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const encoder = new TextEncoder();
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const encodedData = encoder.encode(dataString);

    const encryptedData = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv: iv },
      key,
      encodedData
    );

    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return this.arrayBufferToBase64(combined.buffer);
  }

  /**
   * Decrypt data with a specific key
   */
  async decryptWithKey<T = any>(
    encryptedData: string,
    keyBase64: string
  ): Promise<T> {
    const keyBuffer = this.base64ToArrayBuffer(keyBase64);
    const key = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      this.ALGORITHM,
      false,
      ['decrypt']
    );

    const combined = new Uint8Array(this.base64ToArrayBuffer(encryptedData));
    const iv = combined.slice(0, this.IV_LENGTH);
    const data = combined.slice(this.IV_LENGTH);

    const decryptedData = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv: iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedData);

    try {
      return JSON.parse(decryptedString) as T;
    } catch {
      return decryptedString as any;
    }
  }

  /**
   * Clear encryption keys
   */
  clearKeys(): void {
    localStorage.removeItem(this.ENCRYPTION_KEY_STORAGE);
    localStorage.removeItem('enc_salt');
  }

  // ==================== UTILITY METHODS ====================

  private arrayBufferToBase64(buffer: ArrayBuffer | SharedArrayBuffer): string {
    const bytes = new Uint8Array(buffer as ArrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private getSalt(): Uint8Array | null {
    const saltBase64 = localStorage.getItem('enc_salt');
    if (!saltBase64) return null;
    return new Uint8Array(this.base64ToArrayBuffer(saltBase64));
  }

  private saveSalt(salt: Uint8Array): void {
    localStorage.setItem('enc_salt', this.arrayBufferToBase64(salt.buffer));
  }
}
