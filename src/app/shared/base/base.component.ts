import { HttpClient } from '@angular/common/http';
import { Directive, inject, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { AuthService, TokenService } from 'src/app/modules/auth/services';
import {
  ThemeService,
  ToastService,
  TranslationService,
} from '../services';

@Directive()
export abstract class BaseComponent implements OnDestroy {
  language: string = '';

  readonly activatedRoute = inject(ActivatedRoute);
  readonly routerService = inject(Router);
  readonly translateService = inject(TranslateService);
  readonly fb = inject(FormBuilder);
  readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);
  readonly tokenService = inject(TokenService);
  readonly translate = inject(TranslationService);
  readonly themeService = inject(ThemeService);
  readonly http = inject(HttpClient);

  destroy$ = new Subject<void>();

  constructor() {
    this.initializeLanguage();
  }

  get currentLang() {
    return this.translateService.currentLang;
  }

  get direction() {
    return this.translateService.currentLang === 'ar' ? 'rtl' : 'ltr';
  }

  get currentTheme(): string {
    return this.themeService.getCurrentTheme();
  }

  initializeLanguage(): void {
    this.translateService.onLangChange.subscribe((event: any) => {
      this.language = event.lang;
    });
  }

  changeLanguage(): void {
    const lang = this.language === 'ar' ? 'en' : 'ar';
    this.translate.setLanguage(lang);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logOut(): void {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
