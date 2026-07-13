import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { PlanSlug, getPlanColor } from '../../models/plan.model';

@Component({
  selector: 'app-plan-badge',
  template: `
    <ion-badge
      [color]="getPlanColor()"
      class="plan-badge"
      (click)="navigateToSubscription()"
    >
      <ion-icon name="star" *ngIf="planSlug === 'premium'"></ion-icon>
      <ion-icon name="flash" *ngIf="planSlug === 'pro'"></ion-icon>
      {{ getPlanName() }}
    </ion-badge>
  `,
  styles: [
    `
      .plan-badge {
        cursor: pointer;
        padding: 6px 12px;
        font-weight: 600;
        font-size: 12px;
        border-radius: 12px;
        transition: all 0.3s ease;

        ion-icon {
          margin-inline-end: 4px;
          font-size: 14px;
        }

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3);
        }
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
})
export class PlanBadgeComponent {
  @Input() planSlug: PlanSlug = PlanSlug.Free;

  constructor(private router: Router) {}

  getPlanColor(): string {
    return getPlanColor(this.planSlug);
  }

  getPlanName(): string {
    const names: Record<PlanSlug, string> = {
      [PlanSlug.Free]: 'Free',
      [PlanSlug.Pro]: 'Pro',
      [PlanSlug.Premium]: 'Premium',
    };
    return names[this.planSlug] || this.planSlug;
  }

  navigateToSubscription() {
    this.router.navigate(['/subscription']);
  }
}
