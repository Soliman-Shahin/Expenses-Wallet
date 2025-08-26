import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChartTooltipComponent,
  TooltipData,
} from '../../ui/chart-tooltip/chart-tooltip.component';

interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule, ChartTooltipComponent],
  template: `
    <div class="chart-container" [attr.aria-label]="ariaLabel">
      <h3 *ngIf="title" class="chart-title">{{ title }}</h3>
      <div
        class="chart-wrapper"
        role="img"
        [attr.aria-label]="chartDescription"
        (mouseleave)="onMouseLeave()"
      >
        <div class="chart-bars">
          <div
            *ngFor="let item of chartData; let i = index"
            class="bar-container"
          >
            <div class="bar-area">
              <div
                class="bar"
                [style.height]="getBarHeight(item.value)"
                [style.background-color]="getBarColor(i)"
                [attr.aria-label]="item.name + ': ' + item.value"
                role="img"
                (mouseenter)="onMouseEnter($event, item, i)"
                (mousemove)="onMouseMove($event)"
              ></div>
            </div>
            <div class="bar-meta">
              <div class="bar-label">{{ item.name }}</div>
              <div class="bar-value">{{ item.value | number : '1.0-0' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <app-chart-tooltip
      [data]="tooltipData"
      [visible]="tooltipVisible"
      [top]="tooltipTop"
      [inlineOffset]="tooltipInlineOffset"
    ></app-chart-tooltip>
  `,
  styleUrls: ['./bar-chart.component.scss'],
})
export class BarChartComponent implements OnChanges {
  @Input() data: ChartData[] = [];
  @Input() title: string = '';
  @Input() ariaLabel: string = 'Bar chart';
  @Input() chartDescription: string = 'Bar chart visualization';
  @Input() containerHeight: string = '200px';

  chartData: ChartData[] = [];
  maxValue: number = 0;

  // Tooltip properties
  tooltipVisible = false;
  tooltipData: TooltipData | null = null;
  tooltipTop = '0px';
  tooltipInlineOffset = '0px';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.chartData = [...this.data];
      this.calculateMaxValue();
    }
  }

  private calculateMaxValue(): void {
    this.maxValue = Math.max(...this.chartData.map((item) => item.value), 0);
  }

  getBarHeight(value: number): string {
    if (this.maxValue === 0) return '0%';
    const raw = (value / this.maxValue) * 100;
    // Clamp to avoid touching edges and reserve space for labels below
    const clamped = Math.max(5, Math.min(60, raw));
    return `${clamped}%`;
  }

  getBarColor(index: number): string {
    // Simple color palette for bars
    const colors = [
      '#3880ff', // primary blue
      '#5260ff', // secondary blue
      '#2dd36f', // success green
      '#ffc409', // warning yellow
      '#eb445a', // danger red
      '#8884d8', // purple
      '#82ca9d', // light green
      '#ffc658', // light orange
    ];
    return colors[index % colors.length];
  }

  onMouseEnter(event: MouseEvent, item: ChartData, index: number): void {
    this.tooltipData = {
      label: item.name,
      value: item.value.toString(),
      color: this.getBarColor(index),
    };
    this.tooltipVisible = true;
    this.updateTooltipPosition(event);
  }

  onMouseMove(event: MouseEvent): void {
    if (this.tooltipVisible) {
      this.updateTooltipPosition(event);
    }
  }

  onMouseLeave(): void {
    this.tooltipVisible = false;
  }

  private updateTooltipPosition(event: MouseEvent): void {
    const offsetX = 15;
    const offsetY = 15;
    this.tooltipInlineOffset = `${event.clientX + offsetX}px`;
    this.tooltipTop = `${event.clientY + offsetY}px`;
  }
}
