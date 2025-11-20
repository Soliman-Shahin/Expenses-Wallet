import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import {
  BackupService,
  BackupMetadata,
} from 'src/app/core/services/backup.service';

@Component({
  selector: 'app-backup-restore',
  templateUrl: './backup-restore.component.html',
  styleUrls: ['./backup-restore.component.scss'],
})
export class BackupRestoreComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  backupHistory: BackupMetadata[] = [];
  isLoading = false;
  loadingMessage = '';

  constructor(
    private backupService: BackupService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.backupHistory = this.backupService.getBackupHistory();
  }

  async createBackup() {
    const alert = await this.alertCtrl.create({
      header: 'إنشاء نسخة احتياطية',
      message: 'هل تريد تشفير النسخة الاحتياطية بكلمة مرور؟',
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: 'كلمة المرور (اختياري)',
        },
      ],
      buttons: [
        {
          text: 'إلغاء',
          role: 'cancel',
        },
        {
          text: 'إنشاء',
          handler: (data) => {
            this.performBackup(!!data.password, data.password);
          },
        },
      ],
    });

    await alert.present();
  }

  private performBackup(encrypt: boolean, password?: string) {
    this.isLoading = true;
    this.loadingMessage = 'جاري إنشاء النسخة الاحتياطية...';

    this.backupService.createFullBackup(encrypt, password).subscribe({
      next: async (backup) => {
        this.isLoading = false;
        this.loadHistory();

        // Export immediately
        try {
          await this.backupService.exportBackup(backup);
          this.showToast(
            'تم إنشاء النسخة الاحتياطية وتصديرها بنجاح',
            'success'
          );
        } catch (error) {
          this.showToast('تم الإنشاء ولكن فشل التصدير', 'warning');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showToast('فشل إنشاء النسخة الاحتياطية', 'danger');
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
        this.showToast('ملف غير صالح', 'danger');
        return;
      }

      if (backupData.encrypted) {
        const alert = await this.alertCtrl.create({
          header: 'فك التشفير',
          message: 'هذه النسخة مشفرة. الرجاء إدخال كلمة المرور.',
          inputs: [
            {
              name: 'password',
              type: 'password',
              placeholder: 'كلمة المرور',
            },
          ],
          buttons: [
            {
              text: 'إلغاء',
              role: 'cancel',
            },
            {
              text: 'استعادة',
              handler: async (data) => {
                if (!data.password) {
                  this.showToast('كلمة المرور مطلوبة', 'warning');
                  return false;
                }
                await this.performRestore(content, data.password);
                return true;
              },
            },
          ],
        });
        await alert.present();
      } else {
        const alert = await this.alertCtrl.create({
          header: 'تأكيد الاستعادة',
          message:
            'سيتم استبدال البيانات الحالية بالبيانات الموجودة في النسخة الاحتياطية. هل أنت متأكد؟',
          buttons: [
            {
              text: 'إلغاء',
              role: 'cancel',
            },
            {
              text: 'نعم، استعادة',
              handler: () => {
                this.performRestore(content);
              },
            },
          ],
        });
        await alert.present();
      }
    } catch (error) {
      this.showToast('حدث خطأ أثناء قراءة الملف', 'danger');
    }
  }

  private async performRestore(content: string, password?: string) {
    this.isLoading = true;
    this.loadingMessage = 'جاري استعادة البيانات...';

    try {
      const backup = await this.backupService.importBackup(content, password);

      this.backupService.restoreFromBackup(backup).subscribe({
        next: (success) => {
          this.isLoading = false;
          if (success) {
            this.showToast('تم استعادة البيانات بنجاح', 'success');
            // Optional: Reload app or navigate to home
          } else {
            this.showToast('فشل استعادة البيانات', 'danger');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showToast('حدث خطأ أثناء الاستعادة', 'danger');
          console.error(error);
        },
      });
    } catch (error) {
      this.isLoading = false;
      this.showToast('كلمة المرور غير صحيحة أو الملف تالف', 'danger');
    }
  }

  async shareBackup(backupMetadata: BackupMetadata) {
    // Since we don't store the full backup content in history (too large),
    // we can't re-export from history directly without reading from storage/file.
    // For now, we'll just show info.
    // Ideally, we should store backups in files and keep paths in metadata.
    this.showToast(
      'المشاركة من السجل غير مدعومة حالياً. قم بإنشاء نسخة جديدة للمشاركة.',
      'medium'
    );
  }

  formatSize(bytes: number): string {
    return this.backupService.formatFileSize(bytes);
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'medium'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
