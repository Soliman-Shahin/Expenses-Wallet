import {
  Injectable,
  Renderer2,
  RendererFactory2,
  effect,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { StatusBar, Style } from '@capacitor/status-bar';

export type ThemePreference = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'theme';
  private renderer: Renderer2;
  private readonly systemThemeQuery = window.matchMedia(
    '(prefers-color-scheme: dark)'
  );
  private systemThemeListener?: (event: MediaQueryListEvent) => void;
  readonly preference = signal<ThemePreference>(this.readPreference());
  readonly theme = signal<ResolvedTheme>(this.resolve(this.preference()));
  readonly theme$ = toObservable(this.theme);

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);

    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
    });
    effect(() => {
      const preference = this.preference();
      this.theme.set(this.resolve(preference));
      this.syncSystemThemeListener(preference);
    });
  }

  initTheme() {
    this.preference.set(this.readPreference());
    this.syncSystemThemeListener(this.preference());
  }

  setTheme(preference: ThemePreference): void {
    this.preference.set(preference);
    localStorage.setItem(this.storageKey, preference);
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  getPreference(): ThemePreference {
    return this.preference();
  }

  private readPreference(): ThemePreference {
    const stored = localStorage.getItem(this.storageKey);
    return stored === 'light' || stored === 'dark' || stored === 'auto'
      ? stored
      : 'auto';
  }

  private resolve(preference: ThemePreference): ResolvedTheme {
    return preference === 'auto'
      ? this.systemThemeQuery.matches
        ? 'dark'
        : 'light'
      : preference;
  }

  private syncSystemThemeListener(preference: ThemePreference): void {
    if (this.systemThemeListener) {
      this.systemThemeQuery.removeEventListener(
        'change',
        this.systemThemeListener
      );
      this.systemThemeListener = undefined;
    }
    if (preference === 'auto') {
      this.systemThemeListener = () => this.theme.set(this.resolve('auto'));
      this.systemThemeQuery.addEventListener(
        'change',
        this.systemThemeListener
      );
    }
  }

  private applyTheme(theme: ResolvedTheme): void {
    if (theme === 'dark') {
      this.renderer.addClass(document.body, 'dark');
      document.documentElement.classList.add('dark');
      void StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
    } else {
      this.renderer.removeClass(document.body, 'dark');
      document.documentElement.classList.remove('dark');
      void StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);
    }
  }

  getCurrentTheme() {
    return this.theme();
  }

  isDarkMode(): boolean {
    return document.body.classList.contains('dark');
  }
}
