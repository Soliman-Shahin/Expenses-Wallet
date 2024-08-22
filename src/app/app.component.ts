import { Component, OnInit } from '@angular/core';
import { BaseComponent } from './shared/base';
import { Tab } from './shared/models';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent extends BaseComponent implements OnInit {
  private htmlElement: HTMLElement = document.getElementsByTagName('html')[0];

  tabs: Tab[] = [];

  constructor() {
    super();
  }

  ngOnInit() {
    this.loadTabsData();
    this.setTheme();
  }

  private loadTabsData() {
    this.http.get<Tab[]>('./assets/env/tabs.json').subscribe(
      (data) => {
        this.tabs = data;
      },
      (error) => {
        console.error('Error loading tabs data:', error);
      }
    );
  }

  private setTheme() {
    const currentTheme = this.currentTheme;
    this.htmlElement.classList.add(currentTheme);
  }
}
