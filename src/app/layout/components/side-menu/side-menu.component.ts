import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonMenu } from '@ionic/angular';
import { BaseComponent } from 'src/app/shared/base/base.component';
import { MenuItem } from 'src/app/shared/models';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent
  extends BaseComponent
  implements OnInit, AfterViewInit
{
  @ViewChild('menu') menu!: IonMenu;
  private menuInitialized = false;
  private firstMenuItem?: HTMLElement;
  activeLink = '';
  isDarkMode = false;
  defaultAvatar = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  user$ = this.authService.user$;
  publicMenuItems: MenuItem[] = [];

  menuItems: MenuItem[] = [
    {
      title: 'DASHBOARD',
      icon: 'home-outline',
      link: '/dashboard',
      requiresAuth: true,
    },
    {
      title: 'TRANSACTIONS',
      icon: 'swap-horizontal-outline',
      link: '/transactions',
      requiresAuth: true,
    },
    {
      title: 'CATEGORIES',
      icon: 'pricetags-outline',
      link: '/categories',
      requiresAuth: true,
    },
    {
      title: 'REPORTS',
      icon: 'bar-chart-outline',
      link: '/reports',
      requiresAuth: true,
    },
    {
      title: 'SETTINGS',
      icon: 'settings-outline',
      link: '/settings',
      requiresAuth: true,
    },
    {
      title: 'ABOUT',
      icon: 'information-circle-outline',
      link: '/about',
      requiresAuth: false,
    },
  ];

  // Add method to close menu
  async closeMenu() {
    await this.menuCtrl?.close();
  }

  constructor() {
    super();
    // Initialize language from localStorage or browser
    this.language =
      localStorage.getItem('userLanguage') ||
      window.navigator.language.split('-')[0] ||
      'en';
    this.translateService.use(this.language);
  }

  override ngOnInit() {
    this.publicMenuItems = this.menuItems.filter((item) => !item.requiresAuth);
    // Set initial active link
    this.setActiveLink(this.router.url);

    // Subscribe to route changes
    const routeSub = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.setActiveLink(event.url);
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

  setActiveLink(url: string) {
    const baseUrl = url.split('?')[0];
    this.activeLink = baseUrl;
  }

  isActive(link: string): boolean {
    return this.activeLink.startsWith(link);
  }
}
