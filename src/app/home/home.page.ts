import { Component } from '@angular/core';
import { ThemeToggleService, TranslationService } from '../shared/services';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  language: string = '';
  username: string = 'Soliman';
  constructor(
    private translationService: TranslationService,
    private translate: TranslateService,
    private themeToggleService: ThemeToggleService
  ) {
    this.translate.onLangChange.subscribe((event: any) => {
      this.language = event.lang;
    });
  }

  changeLanguage() {
    const lang = this.language === 'ar' ? 'en' : 'ar';
    this.translationService.setLanguage(lang);
  }

  toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    this.themeToggleService.toggleDarkMode(!isDark);
    document.body.classList.toggle('dark-theme');
  }
}
