import { Component, EventEmitter, Output } from '@angular/core';
import { COLORS } from '../../models';

@Component({
  selector: 'app-color-selector',
  templateUrl: './color-selector.component.html',
  styleUrls: ['./color-selector.component.scss'],
})
export class ColorSelectorComponent {
  @Output() color = new EventEmitter();

  colors = COLORS;

  constructor() {}

  selectColor(color: any) {
    this.color.emit(color);
  }

  selectColors(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const color = { name: 'custom', colorCode: inputElement.value };
    this.color.emit(color);
  }
}
