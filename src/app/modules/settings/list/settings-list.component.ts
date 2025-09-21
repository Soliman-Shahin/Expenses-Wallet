import { Component } from '@angular/core';
import { BaseComponent } from 'src/app/shared/base/base.component';

@Component({
  selector: 'app-settings-list',
  templateUrl: './settings-list.component.html',
  styleUrls: ['./settings-list.component.scss'],
})
export class SettingsListComponent extends BaseComponent {
  constructor() {
    super();
  }
}