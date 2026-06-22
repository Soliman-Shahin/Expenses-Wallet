import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

declare const gapi: any;

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
  private readonly DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  ];
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';
  private readonly FOLDER_NAME = 'Expenses-Wallet-Backups';
  
  private isInitialized = false;
  private folderId: string = '';

  constructor() {}

  /**
   * Initialize Google Drive API
   */
  async initializeGoogleDrive(clientId: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    return new Promise((resolve, reject) => {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            clientId: clientId,
            discoveryDocs: this.DISCOVERY_DOCS,
            scope: this.SCOPES,
          });

          this.isInitialized = true;
          resolve();
        } catch (error) {
          console.error('Error initializing Google Drive:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Sign in to Google Drive
   */
  async signIn(): Promise<boolean> {
    try {
      const auth = gapi.auth2.getAuthInstance();
      if (!auth.isSignedIn.get()) {
        await auth.signIn();
      }
      return true;
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
      const auth = gapi.auth2.getAuthInstance();
      if (auth.isSignedIn.get()) {
        await auth.signOut();
      }
      this.folderId = '';
    } catch (error) {
      console.error('Error signing out from Google Drive:', error);
    }
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    try {
      const auth = gapi.auth2.getAuthInstance();
      return auth && auth.isSignedIn.get();
    } catch (error) {
      return false;
    }
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
      const response = await gapi.client.drive.files.list({
        q: `name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (response.result.files && response.result.files.length > 0) {
        this.folderId = response.result.files[0].id;
        return this.folderId;
      }

      // Create new folder
      const folderMetadata = {
        name: this.FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      this.folderId = folder.result.id;
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
      if (!this.isSignedIn()) {
        throw new Error('Not signed in to Google Drive');
      }

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

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
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
      if (!this.isSignedIn()) {
        throw new Error('Not signed in to Google Drive');
      }

      const folderId = await this.getOrCreateFolder();

      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false and mimeType='application/json'`,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime)',
        orderBy: 'modifiedTime desc',
        pageSize: 50,
      });

      return response.result.files || [];
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
      if (!this.isSignedIn()) {
        throw new Error('Not signed in to Google Drive');
      }

      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
      });

      return JSON.stringify(response.result);
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
      if (!this.isSignedIn()) {
        throw new Error('Not signed in to Google Drive');
      }

      await gapi.client.drive.files.delete({
        fileId: fileId,
      });

      return true;
    } catch (error) {
      console.error('Error deleting backup from Google Drive:', error);
      return false;
    }
  }

  /**
   * Get user's Google Drive email
   */
  getUserEmail(): string | null {
    try {
      const auth = gapi.auth2.getAuthInstance();
      if (auth && auth.isSignedIn.get()) {
        const profile = auth.currentUser.get().getBasicProfile();
        return profile.getEmail();
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
