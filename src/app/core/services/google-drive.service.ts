import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleDriveService {
  private readonly FOLDER_NAME = 'Expenses-Wallet-Backups';
  
  private isInitialized = false;
  private folderId: string = '';
  private accessToken: string | null = null;
  private userEmail: string | null = null;

  constructor() {}

  private get GoogleAuth(): any {
    return (window as any)?.Capacitor?.Plugins?.GoogleAuth || (window as any)?.GoogleAuth;
  }

  /**
   * Initialize Google Drive API (and GoogleAuth)
   */
  async initializeGoogleDrive(clientId: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (this.GoogleAuth && typeof this.GoogleAuth.initialize === 'function') {
        await this.GoogleAuth.initialize({
          clientId: clientId,
          scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
          grantOfflineAccess: true,
        });
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing Google Drive (GoogleAuth):', error);
      throw error;
    }
  }

  /**
   * Sign in to Google Drive
   */
  async signIn(): Promise<boolean> {
    try {
      if (!this.GoogleAuth) {
        console.error('GoogleAuth plugin not available');
        return false;
      }
      const user = await this.GoogleAuth.signIn();
      // GoogleAuth plugin returns authentication object with accessToken
      this.accessToken = user.authentication?.accessToken || user.accessToken;
      this.userEmail = user.email || null;
      
      return !!this.accessToken;
    } catch (error) {
      console.error('Error signing in to Google Drive:', error);
      return false;
    }
  }

  /**
   * Sign out from Google Drive
   */
  async signOut(): Promise<void> {
    try {
      if (this.GoogleAuth) {
        await this.GoogleAuth.signOut();
      }
      this.accessToken = null;
      this.userEmail = null;
      this.folderId = '';
    } catch (error) {
      console.error('Error signing out from Google Drive:', error);
    }
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    return !!this.accessToken;
  }

  /**
   * Get user's Google Drive email
   */
  getUserEmail(): string | null {
    return this.userEmail;
  }

  /**
   * Helper method for Google Drive API calls
   */
  private async fetchDriveApi(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.accessToken) {
      throw new Error('Not signed in to Google Drive');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${this.accessToken}`);

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      // Token might be expired, try to sign in again silently (or clear token)
      this.accessToken = null;
      throw new Error('Authentication expired. Please sign in again.');
    }
    return res;
  }

  /**
   * Get or create backup folder
   */
  private async getOrCreateFolder(): Promise<string> {
    if (this.folderId) {
      return this.folderId;
    }

    try {
      // Search for existing folder
      const query = encodeURIComponent(`name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
      const searchRes = await this.fetchDriveApi(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`);
      
      if (!searchRes.ok) {
        throw new Error('Failed to search for folder');
      }

      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) {
        this.folderId = searchData.files[0].id;
        return this.folderId;
      }

      // Create new folder
      const folderMetadata = {
        name: this.FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const createRes = await this.fetchDriveApi('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderMetadata)
      });

      if (!createRes.ok) {
        throw new Error('Failed to create folder');
      }

      const createData = await createRes.json();
      this.folderId = createData.id;
      return this.folderId;
    } catch (error) {
      console.error('Error getting/creating folder:', error);
      throw error;
    }
  }

  /**
   * Upload backup file to Google Drive
   */
  uploadBackup(fileName: string, content: string): Observable<DriveFile> {
    return from(this.uploadBackupAsync(fileName, content));
  }

  private async uploadBackupAsync(fileName: string, content: string): Promise<DriveFile> {
    try {
      const folderId = await this.getOrCreateFolder();

      const file = new Blob([content], { type: 'application/json' });
      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await this.fetchDriveApi('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime', {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file to Google Drive');
      }

      const result = await response.json();
      return {
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        size: parseInt(result.size || '0'),
        createdTime: result.createdTime,
        modifiedTime: result.modifiedTime,
      };
    } catch (error) {
      console.error('Error uploading backup to Google Drive:', error);
      throw error;
    }
  }

  /**
   * List backup files from Google Drive
   */
  listBackups(): Observable<DriveFile[]> {
    return from(this.listBackupsAsync());
  }

  private async listBackupsAsync(): Promise<DriveFile[]> {
    try {
      const folderId = await this.getOrCreateFolder();

      const query = encodeURIComponent(`'${folderId}' in parents and trashed=false and mimeType='application/json'`);
      const response = await this.fetchDriveApi(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,createdTime,modifiedTime)&orderBy=modifiedTime desc&pageSize=50`);

      if (!response.ok) {
        throw new Error('Failed to list backups');
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing backups from Google Drive:', error);
      throw error;
    }
  }

  /**
   * Download backup file from Google Drive
   */
  downloadBackup(fileId: string): Observable<string> {
    return from(this.downloadBackupAsync(fileId));
  }

  private async downloadBackupAsync(fileId: string): Promise<string> {
    try {
      const response = await this.fetchDriveApi(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
      
      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      return await response.text();
    } catch (error) {
      console.error('Error downloading backup from Google Drive:', error);
      throw error;
    }
  }

  /**
   * Delete backup file from Google Drive
   */
  deleteBackup(fileId: string): Observable<boolean> {
    return from(this.deleteBackupAsync(fileId));
  }

  private async deleteBackupAsync(fileId: string): Promise<boolean> {
    try {
      const response = await this.fetchDriveApi(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE'
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting backup from Google Drive:', error);
      return false;
    }
  }
}
