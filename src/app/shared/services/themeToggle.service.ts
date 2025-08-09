import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2;
  private _theme = new BehaviorSubject<string>('light');
  theme$ = this._theme.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  initTheme() {
    const storedTheme = localStorage.getItem('theme') || 'light';
    this._theme.next(storedTheme);

    this.theme$.subscribe((theme) => {
      if (theme === 'dark') {
        this.enableDark();
      } else {
        this.enableLight();
      }
    });
  }

  toggleTheme() {
    const newTheme = this._theme.value === 'dark' ? 'light' : 'dark';
    this._theme.next(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  private enableDark() {
    this.renderer.addClass(document.body, 'dark');
  }

  private enableLight() {
    this.renderer.removeClass(document.body, 'dark');
  }

  getCurrentTheme() {
    return this._theme.value;
  }

  isDarkMode(): boolean {
    return document.body.classList.contains('dark');
  }
}
