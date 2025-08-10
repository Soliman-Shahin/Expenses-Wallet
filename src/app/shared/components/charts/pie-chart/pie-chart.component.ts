import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" [attr.aria-label]="ariaLabel">
      <h3 *ngIf="title" class="chart-title">{{ title }}</h3>
      <div
        class="chart-wrapper"
        role="img"
        [attr.aria-label]="chartDescription"
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
              />
            </g>
          </svg>
        </div>
        <div class="legend" *ngIf="showLegend">
          <div
            *ngFor="let item of chartData; let i = index"
            class="legend-item"
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
  `,
  styleUrls: ['./pie-chart.component.scss'],
})
export class PieChartComponent implements OnChanges {
  @Input() data: ChartData[] = [];
  @Input() title: string = '';
  @Input() ariaLabel: string = 'Pie chart';
  @Input() chartDescription: string = 'Pie chart visualization';
  @Input() showLegend: boolean = true;
  @Input() size: number = 200;
  @Input() strokeWidth: number = 2;

  chartData: ChartData[] = [];
  slices: any[] = [];
  strokeColor: string = '#ffffff';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.chartData = [...this.data];
      this.generateSlices();
    }
  }

  private generateSlices(): void {
    const total = this.chartData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      this.slices = [];
      return;
    }

    let startAngle = 0;
    this.slices = this.chartData.map((item, index) => {
      const sliceAngle = (item.value / total) * 360;
      const endAngle = startAngle + sliceAngle;

      const path = this.describeArc(100, 100, 80, startAngle, endAngle);

      const slice = {
        path: path,
        color: this.getColor(index),
        label: `${item.name && item.name.trim() ? item.name : '—'}: ${
          item.value
        }`,
        value: item.value,
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
    // Simple color palette for slices
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
}
