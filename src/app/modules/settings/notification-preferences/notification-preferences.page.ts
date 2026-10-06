import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/base/base.component';
import { NotificationPreferenceService } from 'src/app/core/services/notification-preference.service';
import { NotificationCategory, NotificationChannel, NotificationPreferences } from 'src/app/core/models/notification-preference.model';
import { NOTIFICATION_CATEGORY_PRESENTATION, NOTIFICATION_CHANNEL_PRESENTATION } from './notification-preferences.constants';

@Component({
  selector: 'app-notification-preferences',
  templateUrl: './notification-preferences.page.html',
  styleUrls: ['./notification-preferences.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, TranslateModule],
})
export class NotificationPreferencesPage extends BaseComponent implements OnInit {
  readonly notificationCategories = NOTIFICATION_CATEGORY_PRESENTATION;
  readonly notificationChannels = NOTIFICATION_CHANNEL_PRESENTATION;
  notificationPreferences: NotificationPreferences;
  loadState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  private readonly busy = new Set<string>();
  private readonly preferenceService = inject(NotificationPreferenceService);

  constructor() {
    super();
    this.notificationPreferences = this.preferenceService.current;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.preferenceService.preferences$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (value) this.notificationPreferences = value;
      this.cdr.markForCheck();
    });
    this.preferenceService.loadState$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.loadState = state;
      this.cdr.markForCheck();
    });
  }

  isBusy(category: NotificationCategory, channel: NotificationChannel): boolean {
    return this.busy.has(`${category}.${channel}`);
  }

  isEnabled(category: NotificationCategory, channel: NotificationChannel): boolean {
    return this.notificationPreferences[category][channel];
  }

  update(category: (typeof this.notificationCategories)[number], channel: NotificationChannel, event: CustomEvent): void {
    if (category.mandatory) return;
    const key = `${category.key}.${channel}`;
    if (this.busy.has(key)) return;
    this.busy.add(key);
    this.preferenceService.update({ [category.key]: { [channel]: !!event.detail?.checked } })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationPreferences = this.preferenceService.current;
          this.busy.delete(key);
          this.cdr.markForCheck();
        },
        error: () => {
          this.busy.delete(key);
          this.toastService.presentErrorToast('bottom', this.translateService.instant('SETTINGS.NOTIFICATION_PREFERENCES_FAILED'));
          this.cdr.markForCheck();
        },
      });
  }

  retry(): void {
    this.preferenceService.load().pipe(takeUntil(this.destroy$)).subscribe({ error: () => this.cdr.markForCheck() });
  }
}
