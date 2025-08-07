import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Directive,
  HostBinding,
  inject,
  OnDestroy,
  OnInit,
  Type,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { HeaderService } from 'src/app/layout/services';
import { ToastService } from '../services/toast.service';
import { TranslationService } from '../services/translation.service';
import {
  MenuController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { LoadingService } from 'src/app/core/services/loading.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { User } from 'src/app/modules/auth/models';
import { ComponentStateService } from '../services/component-state.service';
import { AuthService } from 'src/app/modules/auth/services';
import { ThemeService } from '../services';
import { TokenService } from 'src/app/modules/auth/services';
import { CategoryService } from 'src/app/modules/categories/services';
import { ExpenseService } from 'src/app/core/services/expense.service';
/**
 * Base component that provides common functionality and dependency injection.
 * Can be used with both standalone and module-based components.
 */
@Directive({
  selector: '[appBaseComponent]',
  standalone: true,
})
export abstract class BaseComponent<T = any> implements OnInit, OnDestroy {
  // Common properties
  protected language: string = 'en';
  protected user: User | null = null;
  protected readonly destroy$ = new Subject<void>();

  // Host bindings for common component states
  @HostBinding('class.loading') get isLoading() {
    return this.state.loading();
  }
  @HostBinding('class.error') get hasError() {
    return !!this.state.error();
  }
  @HostBinding('class.rtl') get isRtl() {
    return this.direction === 'rtl';
  }
  @HostBinding('class.ltr') get isLtr() {
    return this.direction === 'ltr';
  }

  // Public methods to manage component state
  public setLoading(isLoading: boolean): void {
    this.state.setLoading(isLoading);
  }

  public setError(error: string | null): void {
    this.state.setError(error);
  }

  // Inject required services
  protected readonly activatedRoute = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly translateService = inject(TranslateService);
  protected readonly fb = inject(FormBuilder);
  protected readonly toastService = inject(ToastService);
  protected readonly authService = inject(AuthService);
  protected readonly translationService = inject(TranslationService);
  protected readonly themeService = inject(ThemeService);
  protected readonly http = inject(HttpClient);
  protected readonly headerService = inject(HeaderService);
  protected readonly tokenService = inject(TokenService);
  // protected readonly transactionService = inject(TransactionService);

  // Optional services with null checks
  protected readonly menuCtrl = inject(MenuController);
  protected readonly toastCtrl = inject(ToastController);
  protected readonly modalCtrl = inject(ModalController);

  // Core services
  protected readonly cdr = inject(ChangeDetectorRef);
  protected readonly expenseService = inject(ExpenseService);
  protected readonly categoryService = inject(CategoryService);
  protected readonly loadingService = inject(LoadingService);
  protected readonly errorHandler = inject(ErrorHandlerService);
  protected readonly state = inject(ComponentStateService);

  /**
   * Initialize the component with common setup
   */
  ngOnInit(): void {
    this.initializeLanguage();
    this.initializeUser();
    this.subscribeToUserChanges();
  }

  //#region Getters & Setters
  /**
   * Gets the current language
   */
  get currentLang(): string {
    return this.translateService?.currentLang || 'en';
  }

  /**
   * Gets the text direction based on current language
   */
  get direction(): 'rtl' | 'ltr' {
    return this.currentLang === 'ar' ? 'rtl' : 'ltr';
  }

  /**
   * Gets the current theme
   */
  get currentTheme(): string {
    return this.themeService.getCurrentTheme();
  }

  /**
   * Handles errors consistently across the application
   * @param message User-friendly error message
   * @param error Original error object
   * @param showToast Whether to show a toast notification
   */
  protected handleError(
    message: string,
    error: any,
    showToast: boolean = true
  ): void {
    this.errorHandler.handleError(error);
    if (showToast) {
      this.toastService.presentErrorToast('bottom', message);
    }
    this.state.setError(message);
    this.state.setLoading(false);
  }
  //#endregion

  //#region User Management
  /**
   * Initializes the current user
   */
  protected initializeUser(): void {
    try {
      this.user = this.authService?.currentUser || null;
      this.cdr.markForCheck();
    } catch (error) {
      this.handleError('Failed to initialize user', error);
    }
  }

  /**
   * Subscribes to user changes
   */
  protected subscribeToUserChanges(): void {
    if (!this.authService?.user$) {
      return;
    }

    this.authService.user$
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.handleError('Failed to load user data', error);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (user: User | null) => {
          this.user = user;
          this.onUserChanged(user);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.handleError('User subscription error', error);
        },
      });
  }

  /**
   * Handles user changes
   * @param user The current user or null if not authenticated
   */
  protected onUserChanged(user: User | null): void {
    // Can be overridden by derived classes
  }

  /**
   * Checks if current user has required role
   * @param role Required role
   * @returns boolean indicating if user has the role
   */
  protected hasRole(role: string): boolean {
    return (
      Array.isArray(this.user?.['roles']) && this.user?.['roles'].includes(role)
    );
  }
  //#endregion

  //#region Language & Theme
  protected initializeLanguage(): void {
    this.translateService?.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: { lang: string }) => {
        this.language = event.lang;
        this.onLanguageChanged(event.lang);
      });
  }

  /**
   * Override this method to handle language changes in derived components
   */
  protected onLanguageChanged(lang: string): void {
    // Can be overridden by derived classes
  }

  changeLanguage(lang?: string): void {
    const newLang = lang || (this.currentLang === 'ar' ? 'en' : 'ar');
    if (this.translationService) {
      this.translationService.setLanguage(newLang);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  //#endregion

  //#region Navigation & Auth
  /**
   * Navigates to the specified route
   * @param commands Navigation commands array
   * @param extras Navigation extras
   */
  protected navigate(
    commands: any[],
    extras?: NavigationExtras
  ): Promise<boolean> {
    return this.router
      .navigate(commands, {
        ...extras,
        queryParams: extras?.queryParams,
        queryParamsHandling: 'merge',
      })
      .catch((error) => {
        this.handleError('Navigation failed', error);
        return false;
      });
  }

  /**
   * Navigates back in the platform's history
   */
  protected goBack(): void {
    this.router
      .navigate(['../'], { relativeTo: this.activatedRoute })
      .catch(console.error);
  }

  /**
   * Handles user logout
   */
  protected logOut(): void {
    this.state.setLoading(true);
    this.authService.logout();
  }

  /**
   * Checks if current route matches the given path
   * @param path Path to check
   */
  protected isActiveRoute(path: string | string[]): boolean {
    const currentUrl = this.router.url;
    if (Array.isArray(path)) {
      return path.some((p) => currentUrl.includes(p));
    }
    return currentUrl.includes(path);
  }
  //#endregion

  //#region Private Helpers
  private navigateToLogin(): void {
    this.router.navigate(['/auth/login']).catch((error) => {
      console.error('Navigation to login failed:', error);
    });
  }
  //#endregion

  //#region Lifecycle
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion
}

/**
 * Decorator to apply base component functionality to a standalone component
 */
export function StandaloneBaseComponent<T extends Type<any>>(component: T) {
  // Add any standalone-specific metadata or behavior here
  return component;
}
