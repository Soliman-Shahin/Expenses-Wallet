import { Component, HostListener, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { BaseComponent } from 'src/app/shared/base/base.component';
import { ThemeService } from 'src/app/shared/services/themeToggle.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent extends BaseComponent implements OnInit {
  // Component state
  title: string = '';
  actionIcon: string = '';
  isCollapsed = false;
  lastScrollTop = 0;
  scrollThreshold = 50;
  callback?: () => void;
  route: string = '';

  isDarkMode = false;
  user$ = this.authService.user$;

  constructor(public override authService: AuthService) {
    super();
  }

  override ngOnInit() {
    // Subscribe to header configuration changes
    this.headerService.buttonConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        this.actionIcon = config.icon || '';
        this.title = config.title || '';
        this.callback = config.callback;
        this.route = config.route || '';
      });
    this.isDarkMode = this.themeService.isDarkMode();
    this.themeService.theme$.subscribe(() => {
      this.isDarkMode = this.themeService.isDarkMode();
    });
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event) {
    const scrollTop =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    if (scrollTop > this.lastScrollTop && scrollTop > this.scrollThreshold) {
      this.isCollapsed = true;
    } else if (
      scrollTop + window.innerHeight <
      document.documentElement.scrollHeight
    ) {
      this.isCollapsed = false;
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  async toggleMenu() {
    this.menuCtrl.toggle();
  }

  onActionButtonClick() {
    if (this.callback) {
      this.callback();
    } else if (this.route) {
      this.router.navigate([this.route]);
    }
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
