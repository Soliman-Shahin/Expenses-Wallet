import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PlanService } from '../../core/services/plan.service';
import { ToastService } from '../../shared/services/toast.service';
import { LoadingService } from '../../core/services/loading.service';
import {
  Plan,
  PlanSlug,
  MyPlanResponse,
  getPlanColor,
} from '../../shared/models/plan.model';
import { PlanCardComponent } from './components/plan-card/plan-card.component';
import { UsageStatsComponent } from './components/usage-stats/usage-stats.component';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.page.html',
  styleUrls: ['./subscription.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    PlanCardComponent,
    UsageStatsComponent,
  ],
})
export class SubscriptionPage implements OnInit {
  private planService = inject(PlanService);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  availablePlans: Plan[] = [];
  currentPlan: MyPlanResponse | null = null;
  selectedSegment: 'plans' | 'usage' = 'plans';
  isLoading = false;

  // Query params (for redirects from guards/interceptors)
  reason?: string;
  limitType?: string;
  permission?: string;

  async ngOnInit() {
    // Get query params
    this.route.queryParams.subscribe((params) => {
      this.reason = params['reason'];
      this.limitType = params['limitType'];
      this.permission = params['permission'];
    });

    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    await this.loadingService.show('LOADING');

    try {
      // Load available plans and current plan in parallel
      const [plans, myPlan] = await Promise.all([
        this.planService.getAvailablePlans(),
        this.planService.getMyPlan(),
      ]);

      this.availablePlans = plans;
      this.currentPlan = myPlan;

      // Show contextual message based on reason
      this.showContextualMessage();
    } catch (error) {
      console.error('Error loading subscription data:', error);
      await this.toastService.show({
        message: 'Failed to load subscription plans',
        color: 'danger',
        duration: 3000,
        position: 'bottom',
      });
    } finally {
      this.isLoading = false;
      await this.loadingService.hide('LOADING');
    }
  }

  private showContextualMessage() {
    if (!this.reason) return;

    let message = '';
    switch (this.reason) {
      case 'limit_exceeded':
        message = 'SUBSCRIPTION.LIMIT_REACHED_MSG';
        break;
      case 'permission_denied':
        message = 'SUBSCRIPTION.FEATURE_LOCKED_MSG';
        break;
      case 'expired':
        message = 'SUBSCRIPTION.PLAN_EXPIRED';
        break;
    }

    if (message) {
      setTimeout(() => {
        this.toastService.show({
          message,
          color: 'warning',
          duration: 4000,
          position: 'bottom',
        });
      }, 500);
    }
  }

  async onUpgrade(plan: Plan) {
    // Don't allow downgrade to free
    if (plan.slug === PlanSlug.Free) {
      await this.toastService.show({
        message: 'Please contact support to downgrade your plan',
        color: 'warning',
        duration: 3000,
        position: 'bottom',
      });
      return;
    }

    // Check if already on this plan
    if (this.currentPlan?.context.planSlug === plan.slug) {
      await this.toastService.show({
        message: 'You are already on this plan',
        color: 'medium',
        duration: 2000,
        position: 'bottom',
      });
      return;
    }

    await this.loadingService.show('LOADING');

    try {
      await this.planService.upgradePlan(plan.slug);

      await this.toastService.show({
        message: `Successfully upgraded to ${plan.name}!`,
        color: 'success',
        duration: 3000,
        position: 'bottom',
      });

      // Reload data
      await this.loadData();
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      await this.toastService.show({
        message: error.error?.message || 'Failed to upgrade plan',
        color: 'danger',
        duration: 3000,
        position: 'bottom',
      });
    } finally {
      await this.loadingService.hide('LOADING');
    }
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  getPlanColor(slug: PlanSlug): string {
    return getPlanColor(slug);
  }

  isCurrentPlan(plan: Plan): boolean {
    return this.currentPlan?.context.planSlug === plan.slug;
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
