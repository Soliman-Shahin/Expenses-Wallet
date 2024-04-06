import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  TranslationService,
  ThemeToggleService,
  AuthService,
} from '../../services';
import { User } from '../../models';

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
    private themeToggleService: ThemeToggleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.translate.onLangChange.subscribe((event: any) => {
      this.language = event.lang;
    });

    // Subscribe to changes in user data
    this.authService.userChanges.subscribe((user: User | null) => {
      this.user = user;
    });

    // Fetch initial user data
    this.user = this.authService.currentUser;
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

  async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      // No need to reload the window
    } catch (error) {
      console.log('Error signing in with Google:', error);
    }
  }

  logOut() {
    this.authService.logout().catch((err) => {
      console.log(`Log out failed: ${err}`);
    });
  }
}
