import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MyPlanResponse } from '../../../../shared/models/plan.model';

@Component({
  selector: 'app-usage-stats',
  templateUrl: './usage-stats.component.html',
  styleUrls: ['./usage-stats.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
})
export class UsageStatsComponent {
  @Input() planData!: MyPlanResponse;

  getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'success';
  }

  formatLimit(limit: number | null): string {
    return limit === null ? '∞' : limit.toString();
  }

  formatDate(date: Date | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }
}
