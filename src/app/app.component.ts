import { Component, OnInit } from '@angular/core';
import { ThemeService } from './shared/services';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  private htmlElement: HTMLElement = document.getElementsByTagName('html')[0];

  tabs: any[] = [
    {
      title: 'HOME',
      path: '/home/app',
      icon: 'home',
      show: true,
      disabled: false,
    },
    {
      title: 'CATEGORIES',
      path: '/home/categories',
      icon: 'list',
      show: true,
      disabled: false,
    },
    {
      title: 'EXPENSES',
      path: '/expenses',
      icon: 'receipt',
      show: true,
      disabled: true,
    },
    {
      title: 'SETTINGS',
      path: '/settings',
      icon: 'settings',
      show: true,
      disabled: true,
    },
  ];

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    const currentTheme = this.themeService.getCurrentTheme();
    this.htmlElement.classList.add(currentTheme);
  }
}
