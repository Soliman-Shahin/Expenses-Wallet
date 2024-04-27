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
export class MenuComponent implements OnInit, OnDestroy {
  language: string = '';
  user!: User;
  private $userSub!: Subscription;

  constructor(
    private translationService: TranslationService,
    private translate: TranslateService,
    private themeService: ThemeService,
    private authService: AuthService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.translate.onLangChange.subscribe((event: any) => {
      this.language = event.lang;
    });

    // this.user = JSON.parse(this.tokenService.getUser());

    this.$userSub = this.tokenService.userChanged.subscribe((user: User) => {
      this.user = user;
    });
  }

  ngOnDestroy() {
    this.$userSub.unsubscribe();
  }

  changeLanguage() {
    const lang = this.language === 'ar' ? 'en' : 'ar';
    this.translationService.setLanguage(lang);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  getCurrentTheme() {
    return this.themeService.getCurrentTheme();
  }

  logOut() {
    this.authService.logout();
  }
}
