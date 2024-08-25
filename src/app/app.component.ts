import { Component, OnInit } from '@angular/core';
import { BaseComponent } from './shared/base';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent extends BaseComponent implements OnInit {
  private htmlElement: HTMLElement = document.getElementsByTagName('html')[0];

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
