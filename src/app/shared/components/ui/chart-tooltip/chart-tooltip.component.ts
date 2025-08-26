import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TooltipData {
  label: string;
  value: string | number;
  color?: string;
}

@Component({
  selector: 'app-chart-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-tooltip.component.html',
  styleUrls: ['./chart-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartTooltipComponent {
  @Input() data: TooltipData | null = null;
  @Input() visible: boolean = false;
  @Input() top: string = '0px';
  @Input() inlineOffset: string = '0px';
}
