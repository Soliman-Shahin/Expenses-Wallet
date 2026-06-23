
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListItemComponent {
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() amount?: number;
  @Input() currency?: string;
  @Input() interactive: boolean = false;
}
