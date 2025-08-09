import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TokenService } from 'src/app/modules/auth/services';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  currentLang: string = '';
  tokenService = inject(TokenService);
  translateService = inject(TranslateService);

  constructor() {
    this.currentLang = this.tokenService.getUserLang() || 'en';
    this.setLanguage(this.currentLang);
  }

  setLanguage(lang: string) {
    if (!lang) {
      return;
    }

    // Set default and ensure TranslateService uses the lang on startup/reload
    this.translateService.setDefaultLang(lang);
    if (this.translateService.currentLang !== lang) {
      this.translateService.use(lang);
    }

    // Set the document direction based on the language
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update the currentLang property
    this.currentLang = lang;

    // Save the selected language in cookie
    this.tokenService.setUserLang(lang);
  }

  getCurrentLanguage(): string {
    return this.currentLang;
  }
}
