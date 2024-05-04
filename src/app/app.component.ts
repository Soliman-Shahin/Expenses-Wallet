import { Component, OnInit } from '@angular/core';
import { ThemeService } from './shared/services';
import { Tab } from './shared/models';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  private htmlElement: HTMLElement = document.getElementsByTagName('html')[0];

  tabs: Tab[] = [];

  constructor(private themeService: ThemeService, private http: HttpClient) {}

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
    const currentTheme = this.themeService.getCurrentTheme();
    this.htmlElement.classList.add(currentTheme);
  }
}
