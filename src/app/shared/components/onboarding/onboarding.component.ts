import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  OnboardingService,
  OnboardingStep,
} from 'src/app/core/services/onboarding.service';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
})
export class OnboardingComponent implements OnInit {
  @ViewChild('slidesContainer') slidesContainer!: ElementRef;

  steps: OnboardingStep[] = [];
  currentStepIndex = 0;

  constructor(
    private onboardingService: OnboardingService,
    private router: Router
  ) {}

  ngOnInit() {
    const state = this.onboardingService.getCurrentState();
    this.steps = state.steps;
    this.currentStepIndex = state.currentStep;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex === this.steps.length - 1;
  }

  onScroll(event: any) {
    const container = event.target;
    const scrollPosition = container.scrollLeft;
    const width = container.offsetWidth;

    // Calculate current index based on scroll position (RTL support might be needed depending on direction)
    // Assuming LTR for scroll logic, but content is RTL.
    // For RTL scrollLeft might be negative or start from right.
    // Let's use a simpler approach: Math.round(scrollPosition / width)

    // Note: In RTL mode, scrollLeft behavior varies by browser.
    // A safer way is to rely on the index updated by buttons, but for swipe support:
    const index = Math.abs(Math.round(scrollPosition / width));
    if (index !== this.currentStepIndex && index < this.steps.length) {
      this.currentStepIndex = index;
      this.onboardingService.goToStep(index);
    }
  }

  next() {
    if (this.isLastStep) {
      this.finish();
    } else {
      this.currentStepIndex++;
      this.scrollToStep(this.currentStepIndex);
      this.onboardingService.nextStep();
    }
  }

  skip() {
    this.onboardingService.skipOnboarding();
    this.router.navigate(['/home']);
  }

  finish() {
    this.onboardingService.completeOnboarding();
    this.router.navigate(['/home']);
  }

  goToStep(index: number) {
    this.currentStepIndex = index;
    this.scrollToStep(index);
    this.onboardingService.goToStep(index);
  }

  private scrollToStep(index: number) {
    if (this.slidesContainer) {
      const container = this.slidesContainer.nativeElement;
      const width = container.offsetWidth;

      // Check direction for RTL support
      const dir = document.dir || 'ltr';
      const multiplier = dir === 'rtl' ? -1 : 1;

      // Actually, for scrollLeft in most modern browsers with dir="rtl",
      // 0 is the rightmost point and it goes negative to the left (Chrome)
      // or starts at max width and goes to 0 (Firefox/IE).
      // The safest cross-browser way for smooth scroll in Angular/Ionic is using scrollIntoView on the child.

      const slides = container.querySelectorAll('.slide');
      if (slides[index]) {
        slides[index].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start',
        });
      }
    }
  }
}
