import { Injectable } from '@angular/core';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { OfflineStorageService } from './offline-storage.service';
import { EncryptionService } from './encryption.service';
import { StorageService } from 'src/app/modules/auth/services/storage.service';

export interface BackupData {
  version: string;
  timestamp: Date;
  encrypted: boolean;
  data: {
    expenses: any[];
    categories: any[];
    user: any;
    settings?: any;
  };
  profileImage?: string; // Base64 encoded image
  metadata: {
    deviceInfo?: string;
    appVersion: string;
    totalExpenses: number;
    totalCategories: number;
  };
}

export interface BackupMetadata {
  id: string;
  name: string;
  timestamp: Date;
  size: number; // in bytes
  encrypted: boolean;
  itemCount: number;
  hasProfileImage: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly BACKUP_VERSION = '1.0.0';
  private readonly BACKUP_STORAGE_KEY = 'backup_history';
  private readonly MAX_BACKUP_HISTORY = 10;
  private readonly SETTINGS_KEY = 'app_settings';

  constructor(
    private offlineStorage: OfflineStorageService,
    private encryptionService: EncryptionService,
    private storageService: StorageService
  ) {}

  /**
   * Create a full backup of all user data including profile image
   */
  createFullBackup(
    encrypt: boolean = false,
    password?: string
  ): Observable<BackupData> {
    return forkJoin({
      expenses: from(this.offlineStorage['getEntitiesSync']('expense')),
      categories: from(this.offlineStorage['getEntitiesSync']('category')),
      user: from(this.offlineStorage['getEntitiesSync']('user')),
      settings: of(this.getSettings()),
      profileImage: from(this.getProfileImage()),
    }).pipe(
      switchMap(({ expenses, categories, user, settings, profileImage }) => {
        const backupData: BackupData = {
          version: this.BACKUP_VERSION,
          timestamp: new Date(),
          encrypted: encrypt,
          data: {
            expenses: expenses || [],
            categories: categories || [],
            user: user?.[0] || null,
            settings: settings,
          },
          profileImage: profileImage,
          metadata: {
            appVersion: this.BACKUP_VERSION,
            totalExpenses: expenses?.length || 0,
            totalCategories: categories?.length || 0,
          },
        };

        if (encrypt) {
          return from(this.encryptBackup(backupData, password));
        }

        return of(backupData);
      }),
      tap((backup) => this.saveBackupMetadata(backup)),
      catchError((error) => {
        console.error('Error creating backup:', error);
        throw new Error('Failed to create backup');
      })
    );
  }

  /**
   * Export backup to file (web download)
   */
  async exportBackup(backup: BackupData, fileName?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const name = fileName || `expenses-wallet-backup-${timestamp}.json`;
      const jsonString = JSON.stringify(backup, null, 2);

      // Web platform - download file
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return name;
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw new Error('Failed to export backup');
    }
  }

  /**
   * Import backup from file
   */
  async importBackup(
    fileContent: string,
    password?: string
  ): Promise<BackupData> {
    try {
      const backup: BackupData = JSON.parse(fileContent);

      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      if (backup.encrypted) {
        return await this.decryptBackup(backup, password);
      }

      return backup;
    } catch (error) {
      console.error('Error importing backup:', error);
      throw new Error('Failed to import backup. Please check the file format.');
    }
  }

  /**
   * Restore data from backup
   */
  restoreFromBackup(
    backup: BackupData,
    includeProfileImage: boolean = true
  ): Observable<boolean> {
    return from(
      Promise.all([
        this.offlineStorage['setEntities']('expense', backup.data.expenses),
        this.offlineStorage['setEntities']('category', backup.data.categories),
        backup.data.user
          ? this.offlineStorage['setEntities']('user', [backup.data.user])
          : Promise.resolve(),
        backup.data.settings
          ? this.saveSettings(backup.data.settings)
          : Promise.resolve(),
        includeProfileImage && backup.profileImage
          ? this.restoreProfileImage(backup.profileImage)
          : Promise.resolve(),
      ])
    ).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error restoring backup:', error);
        return of(false);
      })
    );
  }

  /**
   * Create automatic backup
   */
  createAutoBackup(): Observable<boolean> {
    return this.createFullBackup(true).pipe(
      switchMap((backup) => {
        const backupString = JSON.stringify(backup);
        this.storageService.set('auto_backup', backupString);
        this.storageService.set(
          'auto_backup_timestamp',
          new Date().toISOString()
        );
        return of(true);
      }),
      catchError((error) => {
        console.error('Error creating auto backup:', error);
        return of(false);
      })
    );
  }

  /**
   * Get auto backup
   */
  getAutoBackup(): BackupData | null {
    const backupString = this.storageService.get<string>('auto_backup');
    if (!backupString) return null;

    try {
      return JSON.parse(backupString);
    } catch {
      return null;
    }
  }

  /**
   * Get backup history metadata
   */
  getBackupHistory(): BackupMetadata[] {
    const history = this.storageService.get<BackupMetadata[]>(
      this.BACKUP_STORAGE_KEY
    );
    return history || [];
  }

  // ==================== PRIVATE HELPERS ====================

  private saveBackupMetadata(backup: BackupData): void {
    const history = this.getBackupHistory();

    const metadata: BackupMetadata = {
      id: this.generateId(),
      name: `Backup ${new Date(backup.timestamp).toLocaleDateString()}`,
      timestamp: backup.timestamp,
      size: JSON.stringify(backup).length,
      encrypted: backup.encrypted,
      itemCount:
        backup.metadata.totalExpenses + backup.metadata.totalCategories,
      hasProfileImage: !!backup.profileImage,
    };

    history.unshift(metadata);

    if (history.length > this.MAX_BACKUP_HISTORY) {
      history.splice(this.MAX_BACKUP_HISTORY);
    }

    this.storageService.set(this.BACKUP_STORAGE_KEY, history);
  }

  private async encryptBackup(
    backup: BackupData,
    password?: string
  ): Promise<BackupData> {
    const dataString = JSON.stringify(backup.data);
    const encryptedData = await this.encryptionService.encrypt(
      dataString,
      password
    );

    return {
      ...backup,
      encrypted: true,
      data: encryptedData as any,
    };
  }

  private async decryptBackup(
    backup: BackupData,
    password?: string
  ): Promise<BackupData> {
    if (!backup.encrypted) return backup;

    const decryptedData = await this.encryptionService.decrypt(
      backup.data as any,
      password,
      true
    );

    return {
      ...backup,
      encrypted: false,
      data: decryptedData,
    };
  }

  private async getProfileImage(): Promise<string | undefined> {
    try {
      const userImage = this.storageService.get<string>('user_profile_image');
      return userImage || undefined;
    } catch (error) {
      console.warn('No profile image found:', error);
      return undefined;
    }
  }

  private async restoreProfileImage(imageData: string): Promise<void> {
    try {
      this.storageService.set('user_profile_image', imageData);
    } catch (error) {
      console.error('Error restoring profile image:', error);
    }
  }

  private getSettings(): any {
    return this.storageService.get(this.SETTINGS_KEY) || {};
  }

  private saveSettings(settings: any): Promise<void> {
    return Promise.resolve(
      this.storageService.set(this.SETTINGS_KEY, settings)
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
