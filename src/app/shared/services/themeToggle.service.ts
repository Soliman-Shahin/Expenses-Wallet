import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private DARK_THEME = 'dark-theme';
  private LIGHT_THEME = 'light-theme';
  private htmlElement: HTMLElement = document.getElementsByTagName('html')[0];

  themeChange: EventEmitter<string> = new EventEmitter<string>();

  constructor() {
    this.initializeTheme();
  }

  // Initialize theme on startup
  private initializeTheme() {
    const theme = this.getCurrentTheme();
    this.setTheme(theme);
  }

  // Toggle between dark and light themes
  toggleTheme() {
    const newTheme =
      this.getCurrentTheme() === this.DARK_THEME
        ? this.LIGHT_THEME
        : this.DARK_THEME;
    this.setTheme(newTheme);
  }

  // Set the theme
  private setTheme(theme: string) {
    this.htmlElement.classList.remove(this.DARK_THEME, this.LIGHT_THEME, 'md');
    this.htmlElement.classList.add(theme);
    if (theme === this.DARK_THEME) {
      this.htmlElement.classList.add('md');
    }
    localStorage.setItem('theme', theme);
    // Emit theme change event
    this.themeChange.emit(theme);
  }

  // Check the current theme
  getCurrentTheme(): string {
     return localStorage.getItem('theme') || this.LIGHT_THEME;
   }
}
