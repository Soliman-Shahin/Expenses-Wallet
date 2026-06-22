import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/shared/base/base.component';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { User } from 'src/app/modules/auth/models';

@Component({
  selector: 'app-settings-list',
  templateUrl: './settings-list.component.html',
  styleUrls: ['./settings-list.component.scss'],
})
export class SettingsListComponent extends BaseComponent implements OnInit {
  biometricAvailable = false;
  biometricEnabled = false;

  currentLanguage = 'en';
  selectedTheme = 'light';
  notificationsEnabled = true;
  autoBackupEnabled = false;

  currentUser: User | null = null;

  languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  themes = [
    { value: 'light', label: 'SETTINGS.THEME_LIGHT' },
    { value: 'dark', label: 'SETTINGS.THEME_DARK' },
    { value: 'auto', label: 'SETTINGS.THEME_AUTO' },
  ];

  constructor(private biometricService: BiometricService) {
    super();
  }

  override async ngOnInit() {
    super.ngOnInit();

    // Subscribe to current user changes
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      this.cdr.markForCheck();
    });

    await this.loadSettings();
  }

  async loadSettings() {
    this.biometricAvailable = await this.biometricService.isAvailable();
    this.biometricEnabled = this.biometricService.isEnabled;
    this.currentLanguage = this.currentLang;
    this.selectedTheme = this.currentTheme;
    this.notificationsEnabled =
      localStorage.getItem('notifications') !== 'false';
    this.autoBackupEnabled = localStorage.getItem('autoBackup') === 'true';
    this.cdr.markForCheck();
  }

  async toggleBiometric(event: any) {
    const isEnabled = event.detail.checked;

    if (isEnabled) {
      const verified = await this.biometricService.verifyIdentity();
      if (verified) {
        await this.biometricService.setEnabled(true);
        this.biometricEnabled = true;
        this.toastService.presentSuccessToast(
          'bottom',
          this.translateService.instant('SETTINGS.BIOMETRIC_ENABLED')
        );
      } else {
        event.target.checked = false;
        this.biometricEnabled = false;
        this.toastService.presentErrorToast(
          'bottom',
          this.translateService.instant('SETTINGS.BIOMETRIC_FAILED')
        );
      }
    } else {
      await this.biometricService.setEnabled(false);
      this.biometricEnabled = false;
      this.toastService.presentSuccessToast(
        'bottom',
        this.translateService.instant('SETTINGS.BIOMETRIC_DISABLED')
      );
    }
    this.cdr.markForCheck();
  }

  override changeLanguage(lang?: string): void {
    const newLang = lang || (this.currentLang === 'ar' ? 'en' : 'ar');
    super.changeLanguage(newLang);
    this.currentLanguage = newLang;
    this.toastService.presentSuccessToast(
      'bottom',
      this.translateService.instant('SETTINGS.LANGUAGE_CHANGED')
    );
    this.cdr.markForCheck();
  }

  onLanguageChange(event: any) {
    const lang = event.detail.value;
    this.changeLanguage(lang);
  }

  onThemeChange(event: any) {
    const theme = event.detail.value;
    this.selectedTheme = theme;

    // Apply theme immediately
    const currentTheme = this.themeService.getCurrentTheme();
    if (theme === 'dark' && currentTheme !== 'dark') {
      this.themeService.toggleTheme();
    } else if (theme === 'light' && currentTheme === 'dark') {
      this.themeService.toggleTheme();
    }

    localStorage.setItem('theme', theme);
    this.toastService.presentSuccessToast(
      'bottom',
      this.translateService.instant('SETTINGS.THEME_CHANGED')
    );
    this.cdr.markForCheck();
  }

  toggleNotifications(event: any) {
    this.notificationsEnabled = event.detail.checked;
    localStorage.setItem('notifications', this.notificationsEnabled.toString());
    const messageKey = this.notificationsEnabled
      ? 'SETTINGS.NOTIFICATIONS_ENABLED'
      : 'SETTINGS.NOTIFICATIONS_DISABLED';
    this.toastService.presentSuccessToast(
      'bottom',
      this.translateService.instant(messageKey)
    );
    this.cdr.markForCheck();
  }

  toggleAutoBackup(event: any) {
    this.autoBackupEnabled = event.detail.checked;
    localStorage.setItem('autoBackup', this.autoBackupEnabled.toString());
    const messageKey = this.autoBackupEnabled
      ? 'SETTINGS.AUTO_BACKUP_ENABLED'
      : 'SETTINGS.AUTO_BACKUP_DISABLED';
    this.toastService.presentSuccessToast(
      'bottom',
      this.translateService.instant(messageKey)
    );
    this.cdr.markForCheck();
  }

  navigateToBackup() {
    // Show a toast message since this feature is currently a mockup and doesn't have a module
    this.toastService.presentSuccessToast(
      'bottom',
      this.translateService.instant('COMMON.COMING_SOON') ||
        'Backup & Restore is coming soon!'
    );
  }

  navigateToSync() {
    this.router.navigate(['/settings/sync']);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  async clearCache() {
    const confirmed = await this.alertService.showConfirm({
      title: this.translateService.instant('SETTINGS.CLEAR_CACHE_TITLE'),
      message: this.translateService.instant('SETTINGS.CLEAR_CACHE_MESSAGE'),
    });

    if (confirmed) {
      // Clear only cache, not all localStorage
      const keysToKeep = ['language', 'theme', 'notifications', 'autoBackup'];
      const tempStorage: any = {};

      keysToKeep.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) tempStorage[key] = value;
      });

      localStorage.clear();

      Object.keys(tempStorage).forEach((key) => {
        localStorage.setItem(key, tempStorage[key]);
      });

      this.toastService.presentSuccessToast(
        'bottom',
        this.translateService.instant('SETTINGS.CACHE_CLEARED')
      );
      this.cdr.markForCheck();
    }
  }
}
