import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-action-tile',
  standalone: true,
  imports: [IonicModule, RouterModule],
  templateUrl: './action-tile.component.html',
  styleUrls: ['./action-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionTileComponent {
  @Input() icon!: string;
  @Input() label!: string;
  @Input() ariaLabel?: string;
  @Input() routerLink?: string | any[];
  @Input() disabled: boolean = false;

  @Output() action = new EventEmitter<void>();

  onClick() {
    if (!this.disabled) {
      this.action.emit();
    }
  }
}
