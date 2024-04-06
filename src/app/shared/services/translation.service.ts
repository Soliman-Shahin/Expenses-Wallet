import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  currentLang: string = '';

  constructor(private translate: TranslateService) {
    this.currentLang = localStorage.getItem('lang') || 'en';
    translate.setDefaultLang(this.currentLang);
    this.setLanguage(this.currentLang);
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }
}
