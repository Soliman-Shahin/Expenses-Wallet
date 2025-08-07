import { Component } from '@angular/core';
import { ThemeService } from './shared/services/themeToggle.service';
import { BaseComponent } from './shared/base';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
    constructor(private themeService: ThemeService) {
    this.themeService.initTheme();
  }


}
