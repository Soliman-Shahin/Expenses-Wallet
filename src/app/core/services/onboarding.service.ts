import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from 'src/app/modules/auth/services/storage.service';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  action?: {
    label: string;
    route?: string;
    callback?: () => void;
  };
}

export interface OnboardingConfig {
  steps: OnboardingStep[];
  currentStep: number;
  isCompleted: boolean;
  isSkipped: boolean;
  completedDate?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly STORAGE_KEY = 'onboarding_status';
  private readonly APP_VERSION_KEY = 'app_version';

  // Default onboarding steps - Must be defined before usage in getInitialState
  // Contains translation keys instead of hardcoded text
  private readonly DEFAULT_STEPS: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'ONBOARDING.WELCOME_TITLE',
      description: 'ONBOARDING.WELCOME_DESC',
      icon: 'wallet-outline',
      action: {
        label: 'ONBOARDING.NEXT',
      },
    },
    {
      id: 'expenses',
      title: 'ONBOARDING.EXPENSES_TITLE',
      description: 'ONBOARDING.EXPENSES_DESC',
      icon: 'receipt-outline',
      action: {
        label: 'ONBOARDING.NEXT',
      },
    },
    {
      id: 'categories',
      title: 'ONBOARDING.CATEGORIES_TITLE',
      description: 'ONBOARDING.CATEGORIES_DESC',
      icon: 'pricetags-outline',
      action: {
        label: 'ONBOARDING.NEXT',
      },
    },
    {
      id: 'analytics',
      title: 'ONBOARDING.ANALYTICS_TITLE',
      description: 'ONBOARDING.ANALYTICS_DESC',
      icon: 'analytics-outline',
      action: {
        label: 'ONBOARDING.NEXT',
      },
    },
    {
      id: 'backup',
      title: 'ONBOARDING.BACKUP_TITLE',
      description: 'ONBOARDING.BACKUP_DESC',
      icon: 'shield-checkmark-outline',
      action: {
        label: 'ONBOARDING.NEXT',
      },
    },
    {
      id: 'offline',
      title: 'ONBOARDING.OFFLINE_TITLE',
      description: 'ONBOARDING.OFFLINE_DESC',
      icon: 'cloud-offline-outline',
      action: {
        label: 'ONBOARDING.START',
        route: '/home',
      },
    },
  ];

  private onboardingStateSubject: BehaviorSubject<OnboardingConfig>;
  public onboardingState$: Observable<OnboardingConfig>;

  constructor(private storageService: StorageService) {
    // Initialize subject in constructor to ensure all properties are defined
    this.onboardingStateSubject = new BehaviorSubject<OnboardingConfig>(
      this.getInitialState()
    );
    this.onboardingState$ = this.onboardingStateSubject.asObservable();

    this.checkVersionUpdate();
  }

  /**
   * Check if this is the first launch or version update
   */
  private checkVersionUpdate(): void {
    const currentVersion = '1.0.1'; // Should match package.json
    const storedVersion = this.storageService.get<string>(this.APP_VERSION_KEY);

    if (!storedVersion || storedVersion !== currentVersion) {
      // New install or version update - reset onboarding
      this.resetOnboarding();
      this.storageService.set(this.APP_VERSION_KEY, currentVersion);
    }
  }

  /**
   * Get initial onboarding state
   */
  private getInitialState(): OnboardingConfig {
    const stored = this.storageService.get<OnboardingConfig>(this.STORAGE_KEY);

    if (stored) {
      return {
        ...stored,
        steps: this.DEFAULT_STEPS, // Always use latest steps
      };
    }

    return {
      steps: this.DEFAULT_STEPS,
      currentStep: 0,
      isCompleted: false,
      isSkipped: false,
    };
  }

  /**
   * Check if onboarding should be shown
   */
  shouldShowOnboarding(): boolean {
    const state = this.onboardingStateSubject.value;
    return !state.isCompleted && !state.isSkipped;
  }

  /**
   * Get current onboarding state
   */
  getCurrentState(): OnboardingConfig {
    return this.onboardingStateSubject.value;
  }

  /**
   * Go to next step
   */
  nextStep(): void {
    const currentState = this.onboardingStateSubject.value;
    const nextStepIndex = currentState.currentStep + 1;

    if (nextStepIndex >= currentState.steps.length) {
      this.completeOnboarding();
    } else {
      const newState = {
        ...currentState,
        currentStep: nextStepIndex,
      };

      this.updateState(newState);
    }
  }

  /**
   * Go to previous step
   */
  previousStep(): void {
    const currentState = this.onboardingStateSubject.value;

    if (currentState.currentStep > 0) {
      const newState = {
        ...currentState,
        currentStep: currentState.currentStep - 1,
      };

      this.updateState(newState);
    }
  }

  /**
   * Go to specific step
   */
  goToStep(stepIndex: number): void {
    const currentState = this.onboardingStateSubject.value;

    if (stepIndex >= 0 && stepIndex < currentState.steps.length) {
      const newState = {
        ...currentState,
        currentStep: stepIndex,
      };

      this.updateState(newState);
    }
  }

  /**
   * Skip onboarding
   */
  skipOnboarding(): void {
    const newState = {
      ...this.onboardingStateSubject.value,
      isSkipped: true,
      completedDate: new Date(),
    };

    this.updateState(newState);
  }

  /**
   * Complete onboarding
   */
  completeOnboarding(): void {
    const newState = {
      ...this.onboardingStateSubject.value,
      isCompleted: true,
      completedDate: new Date(),
    };

    this.updateState(newState);
  }

  /**
   * Reset onboarding (for testing or re-showing)
   */
  resetOnboarding(): void {
    const newState: OnboardingConfig = {
      steps: this.DEFAULT_STEPS,
      currentStep: 0,
      isCompleted: false,
      isSkipped: false,
    };

    this.updateState(newState);
  }

  /**
   * Get current step
   */
  getCurrentStep(): OnboardingStep | null {
    const state = this.onboardingStateSubject.value;
    return state.steps[state.currentStep] || null;
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    const state = this.onboardingStateSubject.value;
    return ((state.currentStep + 1) / state.steps.length) * 100;
  }

  /**
   * Check if current step is first
   */
  isFirstStep(): boolean {
    return this.onboardingStateSubject.value.currentStep === 0;
  }

  /**
   * Check if current step is last
   */
  isLastStep(): boolean {
    const state = this.onboardingStateSubject.value;
    return state.currentStep === state.steps.length - 1;
  }

  /**
   * Update and persist state
   */
  private updateState(state: OnboardingConfig): void {
    this.onboardingStateSubject.next(state);
    this.storageService.set(this.STORAGE_KEY, state);
  }

  /**
   * Add custom step (for feature-specific tutorials)
   */
  addCustomStep(step: OnboardingStep, position?: number): void {
    const currentState = this.onboardingStateSubject.value;
    const newSteps = [...currentState.steps];

    if (
      position !== undefined &&
      position >= 0 &&
      position <= newSteps.length
    ) {
      newSteps.splice(position, 0, step);
    } else {
      newSteps.push(step);
    }

    const newState = {
      ...currentState,
      steps: newSteps,
    };

    this.updateState(newState);
  }

  /**
   * Show onboarding again (e.g., after app update with new features)
   */
  showOnboardingAgain(): void {
    const newState = {
      ...this.onboardingStateSubject.value,
      currentStep: 0,
      isCompleted: false,
      isSkipped: false,
    };

    this.updateState(newState);
  }
}
