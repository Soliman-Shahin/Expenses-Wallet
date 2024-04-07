import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  tabs: any[] = [
    { title: 'HOME', path: '/home', icon: 'home', show: true, disabled: false },
    {
      title: 'CATEGORIES',
      path: '/categories',
      icon: 'list',
      show: true,
      disabled: true,
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
  constructor() {}
}
