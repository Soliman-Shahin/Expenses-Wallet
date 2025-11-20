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
  private readonly DEFAULT_STEPS: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'مرحباً بك في Expenses Wallet!',
      description: 'تطبيقك المثالي لإدارة المصروفات الشخصية بسهولة وأمان',
      icon: 'wallet-outline',
      action: {
        label: 'التالي',
      },
    },
    {
      id: 'expenses',
      title: 'تتبع مصروفاتك',
      description:
        'سجل جميع مصروفاتك اليومية وصنفها بسهولة لمعرفة أين تذهب أموالك',
      icon: 'receipt-outline',
      action: {
        label: 'التالي',
      },
    },
    {
      id: 'categories',
      title: 'تنظيم بالفئات',
      description: 'أنشئ فئات مخصصة لمصروفاتك (طعام، مواصلات، ترفيه، وغيرها)',
      icon: 'pricetags-outline',
      action: {
        label: 'التالي',
      },
    },
    {
      id: 'analytics',
      title: 'تحليلات ذكية',
      description:
        'احصل على رؤى واضحة عن عادات الإنفاق من خلال الرسوم البيانية والإحصائيات',
      icon: 'analytics-outline',
      action: {
        label: 'التالي',
      },
    },
    {
      id: 'backup',
      title: 'نسخ احتياطي آمن',
      description: 'احفظ بياناتك بأمان مع إمكانية إنشاء نسخ احتياطية مشفرة',
      icon: 'shield-checkmark-outline',
      action: {
        label: 'التالي',
      },
    },
    {
      id: 'offline',
      title: 'يعمل بدون إنترنت',
      description:
        'استخدم التطبيق في أي وقت حتى بدون اتصال بالإنترنت، وسيتم المزامنة تلقائياً',
      icon: 'cloud-offline-outline',
      action: {
        label: 'ابدأ الآن',
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
