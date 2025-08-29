import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChartTooltipComponent,
  TooltipData,
} from '../../ui/chart-tooltip/chart-tooltip.component';

interface ChartData {
  name: string;
  value: number;
}

interface InternalChartData extends ChartData {
  visible: boolean;
}

@Component({
  selector: 'app-pie-chart',
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
        <div class="pie-chart">
          <svg [attr.viewBox]="getViewBox()" xmlns="http://www.w3.org/2000/svg">
            <g [attr.transform]="getTransform()">
              <path
                *ngFor="let slice of slices; let i = index"
                [attr.d]="slice.path"
                [attr.fill]="slice.color"
                [attr.stroke]="strokeColor"
                [attr.stroke-width]="strokeWidth"
                [attr.aria-label]="slice.label"
                role="img"
                (mouseenter)="onSliceHover($event, chartData[i], slice.originalIndex)"
                (mousemove)="onMouseMove($event)"
                (click)="onSliceClick(chartData[i])"
              />
            </g>
          </svg>
        </div>
        <div class="legend" *ngIf="showLegend">
          <div
            *ngFor="let item of chartData; let i = index"
            class="legend-item"
            [class.legend-item-hidden]="!item.visible"
            (click)="toggleSliceVisibility(i)"
            tabindex="0"
            (keydown.enter)="toggleSliceVisibility(i)"
            role="button"
            [attr.aria-pressed]="!item.visible"
          >
            <div
              class="legend-color"
              [style.background-color]="getColor(i)"
            ></div>
            <div class="legend-label">{{ item.name || '—' }}</div>
            <div class="legend-value">{{ item.value | number : '1.0-0' }}</div>
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
  styleUrls: ['./pie-chart.component.scss'],
})
export class PieChartComponent implements OnChanges {
  @Output() sliceClick = new EventEmitter<ChartData>();
  @Input() data: ChartData[] = [];
  @Input() title: string = '';
  @Input() ariaLabel: string = 'Pie chart';
  @Input() chartDescription: string = 'Pie chart visualization';
  @Input() showLegend: boolean = true;
  @Input() size: number = 200;
  @Input() strokeWidth: number = 2;

  chartData: InternalChartData[] = [];
  slices: any[] = [];
  strokeColor: string = 'var(--ion-card-background)';

  // Tooltip properties
  tooltipVisible = false;
  tooltipData: TooltipData | null = null;
  tooltipTop = '0px';
  tooltipInlineOffset = '0px';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.chartData = this.data.map((item) => ({ ...item, visible: true }));
      this.generateSlices();
    }
  }

  private generateSlices(): void {
    const visibleData = this.chartData.filter((item) => item.visible);
    const total = visibleData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      this.slices = [];
      return;
    }

    let startAngle = 0;
    let dataIndex = -1;
    this.slices = this.chartData.map((item) => {
      if (!item.visible) {
        return {
          path: '',
          color: 'transparent',
          label: '',
          value: 0,
        };
      }
      dataIndex++;
      const sliceAngle = (item.value / total) * 360;
      const endAngle = startAngle + sliceAngle;

      const path = this.describeArc(100, 100, 80, startAngle, endAngle);

      const slice = {
        path: path,
        color: this.getColor(dataIndex),
        label: `${item.name && item.name.trim() ? item.name : '—'}: ${
          item.value
        }`,
        value: item.value,
        originalIndex: dataIndex,
      };

      startAngle = endAngle;
      return slice;
    });
  }

  getViewBox(): string {
    return `0 0 ${this.size} ${this.size}`;
  }

  getTransform(): string {
    const scale = this.size / 200;
    return `scale(${scale})`;
  }

  // Function to create SVG path for a pie slice
  private describeArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): string {
    const start = this.polarToCartesian(x, y, radius, endAngle);
    const end = this.polarToCartesian(x, y, radius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    const d = [
      'M',
      x,
      y,
      'L',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      'Z',
    ].join(' ');

    return d;
  }

  private polarToCartesian(
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  getColor(index: number): string {
    const colors = [
      'var(--ion-color-primary)',
      'var(--ion-color-secondary)',
      'var(--ion-color-tertiary)',
      'var(--ion-color-success)',
      'var(--ion-color-warning)',
      'var(--ion-color-danger)',
      'var(--ion-color-light)',
      'var(--ion-color-medium)',
    ];
    return colors[index % colors.length];
  }

  // Tooltip event handlers
  onSliceHover(event: MouseEvent, item: InternalChartData, index: number) {
    this.tooltipData = {
      label: item.name,
      value: item.value,
      color: this.getColor(index),
    };
    this.tooltipVisible = true;
    this.updateTooltipPosition(event);
  }

  onMouseMove(event: MouseEvent) {
    if (this.tooltipVisible) {
      this.updateTooltipPosition(event);
    }
  }

  onSliceClick(item: InternalChartData): void {
    this.sliceClick.emit(item);
  }

  onMouseLeave() {
    this.tooltipVisible = false;
  }

  private updateTooltipPosition(event: MouseEvent) {
    const offsetX = 15;
    const offsetY = 15;
    this.tooltipInlineOffset = `${event.clientX + offsetX}px`;
    this.tooltipTop = `${event.clientY + offsetY}px`;
  }

  toggleSliceVisibility(index: number): void {
    this.chartData[index].visible = !this.chartData[index].visible;
    this.generateSlices();
  }
}
