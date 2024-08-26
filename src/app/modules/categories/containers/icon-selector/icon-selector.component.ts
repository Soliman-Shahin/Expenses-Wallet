import { Component, EventEmitter, Output } from '@angular/core';
import { ICONS } from '../../models';

@Component({
  selector: 'app-icon-selector',
  templateUrl: './icon-selector.component.html',
  styleUrls: ['./icon-selector.component.scss'],
})
export class IconSelectorComponent {
  icons = ICONS;
  @Output() icon = new EventEmitter();
  constructor() {}

  selectIcon(icon: string): void {
    this.icon.emit(icon);
  }
}
