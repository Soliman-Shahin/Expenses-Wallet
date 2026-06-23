import { Component, ChangeDetectionStrategy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { NavigationEnd, RouterLink } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { IonMenu, IonicModule } from '@ionic/angular';
import { BaseComponent } from 'src/app/shared/base/base.component';
import { MenuItem } from 'src/app/shared/models';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-side-menu',
    templateUrl: './side-menu.component.html',
    styleUrls: ['./side-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IonicModule, RouterLink, ThemeToggleComponent, AsyncPipe, TranslateModule]
})
export class SideMenuComponent
  extends BaseComponent
  implements OnInit, AfterViewInit
{
  @ViewChild('menu') menu!: IonMenu;
  private menuInitialized = false;
  private firstMenuItem?: HTMLElement;
  defaultAvatar = 'https://ionicframework.com/docs/img/demos/avatar.svg';

  private readonly activeLink$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.url.split('?')[0]),
    startWith(this.router.url.split('?')[0])
  );

  vm$!: Observable<{
    profile: { user: any | null; isLoggedIn: boolean };
    links: MenuItem[];
    language: string;
    activeLink: string;
  }>;

  // Add method to close menu
  async closeMenu() {
    await this.menuCtrl?.close();
  }

  override ngOnInit() {
    super.ngOnInit();

    this.vm$ = combineLatest({
      profile: this.profile$,
      links: this.links$,
      language: this.language$,
      activeLink: this.activeLink$,
    });
  }

  onMenuOpen() {
    // Focus management when menu opens
    setTimeout(() => {
      const menuContent = document.querySelector('ion-menu ion-content');
      if (menuContent) {
        const focusable = menuContent.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        if (focusable) {
          focusable.focus();
        }
      }
    }, 50);
  }

  async ngAfterViewInit() {
    // Initialize the menu
    this.initializeMenu();
  }

  private async initializeMenu() {
    try {
      await this.menuCtrl?.enable(true, 'main-menu');
      this.menuInitialized = true;
    } catch (error) {
      console.error('Error initializing menu:', error);
    }

    // Log menu state changes
    this.menu.ionWillOpen.subscribe(() => {
      const sideMenu = document.querySelector('app-side-menu');
      if (sideMenu) {
        sideMenu.classList.add('menu-open');
      }
    });

    this.menu.ionDidOpen.subscribe(() => {});

    this.menu.ionWillClose.subscribe(() => {});

    this.menu.ionDidClose.subscribe(() => {
      const sideMenu = document.querySelector('app-side-menu');
      if (sideMenu) {
        sideMenu.classList.remove('menu-open');
      }
    });

    // Set up menu focus management
    const menuSub = this.menu.ionWillOpen.subscribe(() => {
      // Store the first focusable element when menu opens
      setTimeout(() => {
        const menuContent = document.querySelector('ion-menu ion-content');
        if (menuContent) {
          const focusable = menuContent.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          if (focusable) {
            this.firstMenuItem = focusable;
            this.firstMenuItem.focus();
          }
        }
      }, 100);
    });
  }

  isActive(link: string, activeLink: string): boolean {
    return activeLink.startsWith(link);
  }
}
