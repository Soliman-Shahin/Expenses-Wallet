import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs';
import { AppNotification } from 'src/app/core/models/app-notification.model';
import { ApiService } from 'src/app/core/services/api.service';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Notification</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-spinner *ngIf="loading"></ion-spinner>
      <ion-card *ngIf="notification as item">
        <ion-card-header>
          <ion-card-title>{{ item.title }}</ion-card-title>
          <ion-card-subtitle>{{ item.createdAt | date: 'medium' }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>{{ item.message }}</ion-card-content>
      </ion-card>
      <ion-text color="danger" *ngIf="error">{{ error }}</ion-text>
    </ion-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationDetailComponent implements OnInit {
  notification: AppNotification | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      this.loading = false;
      this.error = 'Notification not found.';
      return;
    }

    this.apiService
      .get<AppNotification>(`/notifications/${id}`)
      .pipe(
        finalize(() => {
          this.loading = false;
          if (!this.notification && !this.error) {
            this.error = 'This notification is unavailable.';
          }
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (notification) => {
          this.notification = notification;
          this.apiService
            .patch(`/notifications/${id}/read`, {})
            .subscribe({ error: () => undefined });
        },
        error: () => {
          this.error = 'This notification is unavailable.';
        },
      });
  }
}
