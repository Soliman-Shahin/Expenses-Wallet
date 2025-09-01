import { Component, Input, ChangeDetectionStrategy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface TooltipData {
  label: string;
  value: string | number;
  color?: string;
}

@Component({
  selector: 'app-chart-tooltip',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './chart-tooltip.component.html',
  styleUrls: ['./chart-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartTooltipComponent {
  @Input() data: TooltipData | null = null;
  @Input() visible: boolean = false;

  @HostBinding('style.top')
  @Input() top: string = '0px';

  @HostBinding('style.left')
  @Input() left: string = '0px';

  @HostBinding('class.tooltip-visible')
  get isVisible() {
    return this.visible;
  }
}
