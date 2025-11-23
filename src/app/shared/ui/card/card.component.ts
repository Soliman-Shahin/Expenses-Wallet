import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() padding: 'sm' | 'md' | 'lg' | 'none' = 'md';
  @Input()
  set interactive(value: boolean | string) {
    this._interactive = value === '' || !!value;
  }
  get interactive(): boolean {
    return this._interactive;
  }
  private _interactive = false;

  @HostBinding('class')
  get hostClasses(): string {
    return [
      'app-card',
      `app-card-padding-${this.padding}`,
      this.interactive ? 'app-card-interactive' : '',
    ].join(' ');
  }
}
