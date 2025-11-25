import { Component, ChangeDetectionStrategy, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  BackupService,
  BackupMetadata,
} from 'src/app/core/services/backup.service';
import { BaseComponent } from '../../base/base.component';

@Component({
  selector: 'app-backup-restore',
  templateUrl: './backup-restore.component.html',
  styleUrls: ['./backup-restore.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackupRestoreComponent extends BaseComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  backupHistory: BackupMetadata[] = [];
  loadingMessage = '';

  constructor(private backupService: BackupService) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.loadHistory();
  }

  loadHistory() {
    this.backupHistory = this.backupService.getBackupHistory();
  }

  async createBackup() {
    const alert = await this.modalCtrl.create({
      component: 'ion-alert',
      cssClass: 'custom-alert',
      componentProps: {
        header: this.translateService.instant('BACKUP.CREATE_ALERT_TITLE'),
        message: this.translateService.instant('BACKUP.CREATE_ALERT_MSG'),
        inputs: [
          {
            name: 'password',
            type: 'password',
            placeholder: this.translateService.instant(
              'BACKUP.PASSWORD_PLACEHOLDER'
            ),
          },
        ],
        buttons: [
          {
            text: this.translateService.instant('COMMON.CANCEL'),
            role: 'cancel',
          },
          {
            text: this.translateService.instant('COMMON.CREATE'),
            handler: (data: any) => {
              this.performBackup(!!data.password, data.password);
            },
          },
        ],
      },
    });

    await alert.present();
  }

  private performBackup(encrypt: boolean, password?: string) {
    this.setLoading(true);
    this.loadingMessage = this.translateService.instant('COMMON.LOADING');

    this.backupService.createFullBackup(encrypt, password).subscribe({
      next: async (backup) => {
        this.setLoading(false);
        this.loadHistory();

        // Export immediately
        try {
          await this.backupService.exportBackup(backup);
          this.toastService.presentSuccessToast(
            'bottom',
            this.translateService.instant('BACKUP.SUCCESS_CREATE')
          );
        } catch (error) {
          this.toastService.presentWarningToast(
            'bottom',
            this.translateService.instant('BACKUP.FAILED_CREATE')
          );
        }
      },
      error: (error) => {
        this.setLoading(false);
        this.toastService.presentErrorToast(
          'bottom',
          this.translateService.instant('BACKUP.FAILED_CREATE')
        );
        console.error(error);
      },
    });
  }

  triggerImport() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const content = e.target.result;
      await this.processImport(content);
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
  }

  private async processImport(content: string) {
    try {
      // Try to parse first to check if encrypted
      let backupData;
      try {
        backupData = JSON.parse(content);
      } catch {
        this.toastService.presentErrorToast(
          'bottom',
          this.translateService.instant('BACKUP.INVALID_FILE')
        );
        return;
      }

      if (backupData.encrypted) {
        // For encrypted backup, show password prompt
        this.toastService.presentInfoToast(
          'bottom',
          this.translateService.instant('BACKUP.DECRYPT_ALERT_MSG')
        );
        // TODO: Implement proper password dialog
        const password = prompt(
          this.translateService.instant('BACKUP.PASSWORD_PLACEHOLDER')
        );
        if (password) {
          await this.performRestore(content, password);
        }
      } else {
        // For unencrypted backup, ask for confirmation
        if (
          confirm(this.translateService.instant('BACKUP.RESTORE_CONFIRM_MSG'))
        ) {
          await this.performRestore(content);
        }
      }
    } catch (error) {
      this.toastService.presentErrorToast(
        'bottom',
        this.translateService.instant('BACKUP.INVALID_FILE')
      );
    }
  }

  private async performRestore(content: string, password?: string) {
    this.setLoading(true);
    this.loadingMessage = this.translateService.instant('COMMON.LOADING');

    try {
      const backup = await this.backupService.importBackup(content, password);

      this.backupService.restoreFromBackup(backup).subscribe({
        next: (success) => {
          this.setLoading(false);
          if (success) {
            this.toastService.presentSuccessToast(
              'bottom',
              this.translateService.instant('BACKUP.SUCCESS_RESTORE')
            );
            // Optional: Reload app or navigate to home
          } else {
            this.toastService.presentErrorToast(
              'bottom',
              this.translateService.instant('BACKUP.FAILED_RESTORE')
            );
          }
        },
        error: (error) => {
          this.setLoading(false);
          this.toastService.presentErrorToast(
            'bottom',
            this.translateService.instant('BACKUP.FAILED_RESTORE')
          );
          console.error(error);
        },
      });
    } catch (error) {
      this.setLoading(false);
      this.toastService.presentErrorToast(
        'bottom',
        this.translateService.instant('BACKUP.WRONG_PASSWORD')
      );
    }
  }

  async shareBackup(backupMetadata: BackupMetadata) {
    // Since we don't store the full backup content in history (too large),
    // we can't re-export from history directly without reading from storage/file.
    // For now, we'll just show info.
    // Ideally, we should store backups in files and keep paths in metadata.
    this.toastService.presentInfoToast(
      'bottom',
      this.translateService.instant('COMMON.NOT_SUPPORTED')
    );
  }

  formatSize(bytes: number): string {
    return this.backupService.formatFileSize(bytes);
  }
}
