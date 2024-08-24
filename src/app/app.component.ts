import { Component, OnInit } from '@angular/core';
import { TABS_MENU_ITEMS } from './core/constants';
import { BaseComponent } from './shared/base';
import { Tab } from './shared/models';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent extends BaseComponent implements OnInit {
  private htmlElement: HTMLElement = document.getElementsByTagName('html')[0];

  tabs: Tab[] = TABS_MENU_ITEMS;

  constructor() {
    super();
  }

  ngOnInit() {
    this.setTheme();
  }

  private setTheme() {
    const currentTheme = this.currentTheme;
    this.htmlElement.classList.add(currentTheme);
  }
}
