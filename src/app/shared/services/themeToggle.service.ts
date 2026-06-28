import { Injectable, Renderer2, RendererFactory2, signal, effect } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { StatusBar, Style } from '@capacitor/status-bar';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2;
  theme = signal<string>('light');
  theme$ = toObservable(this.theme);

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);

    effect(() => {
      const currentTheme = this.theme();
      if (currentTheme === 'dark') {
        this.enableDark();
      } else {
        this.enableLight();
      }
    });
  }

  initTheme() {
    const storedTheme = localStorage.getItem('theme') || 'light';
    this.theme.set(storedTheme);
  }

  toggleTheme() {
    const newTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  private async enableDark() {
    this.renderer.addClass(document.body, 'dark');
    try {
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (e) {
      // Ignored on web
    }
  }

  private async enableLight() {
    this.renderer.removeClass(document.body, 'dark');
    try {
      // Light style actually means dark text (for light backgrounds)
      await StatusBar.setStyle({ style: Style.Light });
    } catch (e) {
      // Ignored on web
    }
  }

  getCurrentTheme() {
    return this.theme();
  }

  isDarkMode(): boolean {
    return document.body.classList.contains('dark');
  }
}
