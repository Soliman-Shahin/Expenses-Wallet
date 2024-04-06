// theme-toggle.service.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeToggleService {
  toggleDarkMode(isDark: boolean) {
    const root = document.documentElement;
    if (isDark) {
      // Apply dark mode variables
      root.style.setProperty('--ion-color-primary', '#428cff');
      // Update other dark mode variables as needed
    } else {
      // Apply light mode variables
      root.style.setProperty('--ion-color-primary', '#3880ff');
      // Update other light mode variables as needed
    }
  }
}
