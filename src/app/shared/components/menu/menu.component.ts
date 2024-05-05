import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  TranslationService,
  ThemeService,
  AuthService,
  TokenService,
} from '../../services';
import { User } from '../../models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit {
  language: string = '';
  user: User | null = null;

  constructor(
    private translationService: TranslationService,
    private translate: TranslateService,
    private themeService: ThemeService,
    public authService: AuthService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.user = this.tokenService.getUser();
    this.initializeLanguage();
    this.subscribeToUserChanges();
  }

  initializeLanguage(): void {
    this.translate.onLangChange.subscribe((event: any) => {
      this.language = event.lang;
    });
  }

  subscribeToUserChanges(): void {
    this.tokenService.userSubject.subscribe((user: User | null) => {
      this.user = user || null;
    });
  }

  changeLanguage(): void {
    const lang = this.language === 'ar' ? 'en' : 'ar';
    this.translationService.setLanguage(lang);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getCurrentTheme(): string {
    return this.themeService.getCurrentTheme();
  }

  logOut(): void {
    this.authService.logout();
  }
}
