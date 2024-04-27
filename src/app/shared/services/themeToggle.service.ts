import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private DARK_THEME = 'dark-theme';
  private LIGHT_THEME = 'light-theme';

  constructor() {}

  // Toggle between dark and light themes
  toggleTheme() {
    const body = document.getElementsByTagName('body')[0];
    if (body.classList.contains(this.DARK_THEME)) {
      body.classList.remove(this.DARK_THEME);
      body.classList.add(this.LIGHT_THEME);
      this.setCssVariables('--ion-color-primary', '#3880ff');
      this.setCssVariables('--ion-color-secondary', '#3dc2ff');
      // Add other CSS variables for light theme
      localStorage.setItem('theme', this.LIGHT_THEME);
    } else {
      body.classList.remove(this.LIGHT_THEME);
      body.classList.add(this.DARK_THEME);
      this.setCssVariables('--ion-color-primary', '#428cff');
      this.setCssVariables('--ion-color-secondary', '#50c8ff');
      // Add other CSS variables for dark theme
      localStorage.setItem('theme', this.DARK_THEME);
    }
  }

  // Check the current theme
  getCurrentTheme() {
    return localStorage.getItem('theme') || this.LIGHT_THEME;
  }

  // Helper function to set CSS variables
  private setCssVariables(name: string, value: string) {
    document.documentElement.style.setProperty(name, value);
  }
}
