import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/shared/base/base.component';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
})
export class ThemeToggleComponent extends BaseComponent implements OnInit {
  isDarkMode = false;

  override ngOnInit() {
    super.ngOnInit();
    this.isDarkMode = this.themeService.isDarkMode();
    
    // Subscribe to theme changes
    this.themeService.theme$.subscribe((theme) => {
      this.isDarkMode = theme === 'dark';
    });
  }

  override toggleTheme() {
    this.themeService.toggleTheme();
  }
}
