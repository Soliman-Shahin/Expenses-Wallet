import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  currentLang: string = '';

  constructor(
    private translate: TranslateService,
    private tokenService: TokenService
  ) {
    this.currentLang = this.tokenService.getUserLang() || 'en';
    this.setLanguage(this.currentLang);
  }

  setLanguage(lang: string) {
    // Set the language for translation
    this.translate.use(lang);

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
