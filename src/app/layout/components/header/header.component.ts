import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/shared/base';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent extends BaseComponent implements OnInit {
  title: string = '';
  actionIcon: string = '';

  callback?: () => void;
  route: string = '';

  constructor() {
    super();
  }

  ngOnInit() {
    this.headerService.buttonConfig$.subscribe((config) => {
      this.actionIcon = config.icon || '';
      this.title = config.title || '';
      this.callback = config.callback;
      this.route = config.route || '';
    });
  }

  onActionButtonClick() {
    if (this.callback) {
      this.callback();
    } else if (this.route) {
      this.routerService.navigate([this.route]);
    }
  }
}
