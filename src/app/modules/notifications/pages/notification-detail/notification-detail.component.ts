import { TranslateModule } from '@ngx-translate/core';
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
import {
  AppNotification,
  notificationTypePresentation,
} from 'src/app/core/models/app-notification.model';
import { ApiService } from 'src/app/core/services/api.service';
import { SkeletonBlockComponent } from 'src/app/shared/ui/skeleton-block/skeleton-block.component';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, SkeletonBlockComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ 'MOBILE_UI.NOTIFICATION' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding notification-detail-content">
      <div
        *ngIf="loading"
        role="status"
        aria-busy="true"
        [attr.aria-label]="'COMMON.LOADING' | translate"
        class="notification-loading"
      >
        <app-skeleton-block variant="detail"></app-skeleton-block>
      </div>
      <ion-card class="notification-detail-card" *ngIf="notification as item">
        <ion-card-header>
          <div
            class="detail-type"
            [class]="'detail-type tone-' + typePresentation(item.type).tone"
          >
            <ion-icon
              [name]="typePresentation(item.type).icon"
              aria-hidden="true"
            ></ion-icon
            ><span>{{ typePresentation(item.type).labelKey | translate }}</span>
          </div>
          <ion-card-title dir="auto">{{ item.title }}</ion-card-title>
          <ion-card-subtitle
            ><bdi>{{
              item.createdAt | date : 'medium'
            }}</bdi></ion-card-subtitle
          >
        </ion-card-header>
        <ion-card-content
          ><p dir="auto">{{ item.message }}</p></ion-card-content
        >
      </ion-card>
      <ion-text color="danger" role="alert" *ngIf="error">{{
        error | translate
      }}</ion-text>
    </ion-content>
  `,
  styleUrls: ['./notification-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationDetailComponent implements OnInit {
  notification: AppNotification | null = null;
  loading = true;
  error = '';
  typePresentation = notificationTypePresentation;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      this.loading = false;
      this.error = 'MOBILE_UI.NOT_FOUND';
      return;
    }

    const cached = this.notificationService.getCached(id);
    if (cached) {
      this.notification = cached;
      this.loading = false;
      this.cdr.markForCheck();
    }

    this.apiService
      .get<AppNotification>(`/notifications/${id}`)
      .pipe(
        finalize(() => {
          this.loading = false;
          if (!this.notification && !this.error) {
            this.error = 'MOBILE_UI.UNAVAILABLE';
          }
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (notification) => {
          this.notification = notification;
          this.notificationService
            .markRead(id)
            .subscribe({ error: () => undefined });
          this.apiService
            .patch(`/notifications/${id}/read`, {})
            .subscribe({ error: () => undefined });
        },
        error: () => {
          this.error = 'MOBILE_UI.UNAVAILABLE';
        },
      });
  }
}
