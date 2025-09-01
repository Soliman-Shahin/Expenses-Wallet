import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  ChartTooltipComponent,
  TooltipData,
} from '../../ui/chart-tooltip/chart-tooltip.component';
import {
  CHART_DATA,
  CHART_TITLE,
  CHART_ARIA_LABEL,
  CHART_DESCRIPTION,
  CHART_SHOW_LEGEND,
  CHART_SIZE,
  CHART_STROKE_WIDTH,
} from '../chart.tokens';

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
  imports: [CommonModule, ChartTooltipComponent, TranslateModule],
  template: `
    <div class="chart-container" [attr.aria-label]="ariaLabel">
      <h3 *ngIf="title" class="chart-title">{{ title | translate }}</h3>
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
        <div *ngIf="showLegend" class="legend">
          <div *ngFor="let item of legendData" class="legend-item">
            <span class="legend-color" [style.background-color]="item.color"></span>
            <span class="legend-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
    <app-chart-tooltip
      [data]="tooltipData"
      [visible]="tooltipVisible"
      [top]="tooltipTop"
      [left]="tooltipLeft"
    ></app-chart-tooltip>
  `,
  styleUrls: ['./pie-chart.component.scss'],
})
export class PieChartComponent implements OnInit, OnChanges {
  @Output() sliceClick = new EventEmitter<ChartData>();

  // Data can be provided via @Input for standalone use, or via DI when used with ngComponentOutlet.
  @Input() data: ChartData[] = inject(CHART_DATA, { optional: true }) || [];
  @Input() title: string = inject(CHART_TITLE, { optional: true }) || '';
  @Input() ariaLabel: string =
    inject(CHART_ARIA_LABEL, { optional: true }) || 'Pie chart';
  @Input() chartDescription: string =
    inject(CHART_DESCRIPTION, { optional: true }) || 'Pie chart visualization';
  @Input() showLegend: boolean = inject(CHART_SHOW_LEGEND, { optional: true }) ?? true;
  @Input() size: number = inject(CHART_SIZE, { optional: true }) || 200;
  @Input() strokeWidth: number = inject(CHART_STROKE_WIDTH, { optional: true }) || 2;

  chartData: InternalChartData[] = [];
  slices: { path: string; color: string; label: string; originalIndex: number }[] = [];
  legendData: { label: string; color: string }[] = [];
  strokeColor: string = 'var(--ion-background-color, #ffffff)';

  // Tooltip properties
  tooltipVisible = false;
  tooltipData: TooltipData | null = null;
  tooltipTop = '0px';
  tooltipLeft = '0px';

  ngOnInit(): void {
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.processData();
    }
  }

  private processData(): void {
    if (!this.data) {
      this.chartData = [];
      this.slices = [];
      this.legendData = [];
      return;
    }
    this.chartData = this.data.map((item) => ({ ...item, visible: true }));
    this.generateSlices();
  }

  private generateSlices(): void {
    const visibleData = this.chartData.filter((item) => item.visible);
    const total = visibleData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      this.slices = [];
      this.legendData = [];
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
          originalIndex: dataIndex,
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
        originalIndex: dataIndex,
      };

      startAngle = endAngle;
      return slice;
    });

    this.legendData = this.chartData.map((item, index) => ({
      label: item.name,
      color: this.getColor(index),
    }));
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
  onSliceHover(event: MouseEvent, data: ChartData, index: number): void {
    this.tooltipData = {
      label: data.name,
      value: data.value,
      color: this.getColor(index),
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
    this.tooltipLeft = `${event.clientX + offsetX}px`;
    this.tooltipTop = `${event.clientY + offsetY}px`;
  }

  onSliceClick(data: ChartData): void {
    this.sliceClick.emit(data);
  }

  toggleSliceVisibility(index: number): void {
    this.chartData[index].visible = !this.chartData[index].visible;
    this.generateSlices();
  }
}
