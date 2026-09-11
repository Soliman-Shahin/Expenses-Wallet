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
import { AppNotification } from 'src/app/core/models/app-notification.model';
import { ApiService } from 'src/app/core/services/api.service';
import { SkeletonBlockComponent } from 'src/app/shared/ui/skeleton-block/skeleton-block.component';

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
    <ion-content class="ion-padding">
      <div
        *ngIf="loading"
        role="status"
        aria-busy="true"
        [attr.aria-label]="'COMMON.LOADING' | translate"
        class="notification-loading"
      >
        <app-skeleton-block variant="detail"></app-skeleton-block>
      </div>
      <ion-card *ngIf="notification as item">
        <ion-card-header>
          <ion-card-title>{{ item.title }}</ion-card-title>
          <ion-card-subtitle
            ><bdi>{{
              item.createdAt | date : 'medium'
            }}</bdi></ion-card-subtitle
          >
        </ion-card-header>
        <ion-card-content>{{ item.message }}</ion-card-content>
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

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      this.loading = false;
      this.error = 'MOBILE_UI.NOT_FOUND';
      return;
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
