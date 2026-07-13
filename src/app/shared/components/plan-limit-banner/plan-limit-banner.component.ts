import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-plan-limit-banner',
  template: `
    <ion-card
      class="limit-banner"
      [class.warning]="percentage >= 75"
      [class.danger]="percentage >= 90"
    >
      <ion-card-content>
        <div class="banner-content">
          <div class="info">
            <ion-icon [name]="getIcon()"></ion-icon>
            <div>
              <h4>{{ limitType | translate }}</h4>
              <p>{{ used }} / {{ limit === null ? '∞' : limit }}</p>
            </div>
          </div>
          <div class="progress">
            <ion-progress-bar
              [value]="percentage / 100"
              [color]="getColor()"
            ></ion-progress-bar>
            <span class="percentage">{{ percentage }}%</span>
          </div>
          <ion-button
            *ngIf="percentage >= 90"
            size="small"
            color="primary"
            (click)="navigateToSubscription()"
          >
            {{ 'SUBSCRIPTION.UPGRADE' | translate }}
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
      .limit-banner {
        margin: 16px;
        border-radius: 12px;
        border-left: 4px solid var(--ion-color-success);
        transition: all 0.3s ease;

        &.warning {
          border-left-color: var(--ion-color-warning);
        }

        &.danger {
          border-left-color: var(--ion-color-danger);
        }

        .banner-content {
          display: flex;
          align-items: center;
          gap: 16px;

          .info {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;

            ion-icon {
              font-size: 24px;
              color: var(--ion-color-primary);
            }

            h4 {
              font-size: 14px;
              font-weight: 700;
              margin: 0 0 4px 0;
            }

            p {
              font-size: 12px;
              opacity: 0.7;
              margin: 0;
            }
          }

          .progress {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;

            ion-progress-bar {
              height: 6px;
              border-radius: 3px;
            }

            .percentage {
              font-size: 12px;
              font-weight: 700;
              color: var(--ion-color-primary);
              text-align: end;
            }
          }

          ion-button {
            --border-radius: 8px;
          }
        }

        @media (max-width: 576px) {
          .banner-content {
            flex-direction: column;

            .info,
            .progress {
              width: 100%;
            }

            ion-button {
              width: 100%;
            }
          }
        }
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
})
export class PlanLimitBannerComponent {
  @Input() limitType = 'SUBSCRIPTION.CATEGORIES_LIMIT';
  @Input() used = 0;
  @Input() limit: number | null = 0;
  @Input() percentage = 0;

  constructor(private router: Router) {}

  getIcon(): string {
    if (this.percentage >= 90) return 'alert-circle';
    if (this.percentage >= 75) return 'warning';
    return 'information-circle';
  }

  getColor(): string {
    if (this.percentage >= 90) return 'danger';
    if (this.percentage >= 75) return 'warning';
    return 'success';
  }

  navigateToSubscription() {
    this.router.navigate(['/subscription'], {
      queryParams: { reason: 'limit_reached', limitType: this.limitType },
    });
  }
}
