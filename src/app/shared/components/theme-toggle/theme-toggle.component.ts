import { Component, ChangeDetectionStrategy, OnInit,
  Output,
  EventEmitter,
  signal,
  computed,
  DestroyRef,
  inject, } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseComponent } from 'src/app/shared/base/base.component';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent extends BaseComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  // Outputs
  @Output() themeChanged = new EventEmitter<string>();

  // Signals
  private _isDarkModeSignal = signal<boolean>(false);

  // Computed
  isDarkMode = computed(() => this._isDarkModeSignal());
  themeIcon = computed(() => (this.isDarkMode() ? 'sunny' : 'moon'));
  themeLabel = computed(() => (this.isDarkMode() ? 'LIGHT_MODE' : 'DARK_MODE'));

  // Animation state
  isAnimating = signal(false);

  override ngOnInit() {
    super.ngOnInit();

    // Initialize from service
    this._isDarkModeSignal.set(this.themeService.isDarkMode());

    // Subscribe to theme changes with automatic cleanup
    this.themeService.theme$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((theme) => {
        this._isDarkModeSignal.set(theme === 'dark');
      });
  }

  override toggleTheme() {
    // Trigger animation
    this.isAnimating.set(true);

    // Debounce animation
    setTimeout(() => {
      this.isAnimating.set(false);
    }, 600);

    // Toggle theme
    this.themeService.toggleTheme();

    // Emit change event
    const newTheme = this.isDarkMode() ? 'light' : 'dark';
    this.themeChanged.emit(newTheme);
  }

  /**
   * Get animation class for icon
   */
  getIconAnimationClass(): string {
    if (!this.isAnimating()) return '';
    return this.isDarkMode() ? 'rotate' : 'flip-in';
  }
}
