import { Component, Input, OnInit, inject, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ChartTooltipComponent, TooltipData } from '../../ui/chart-tooltip/chart-tooltip.component';
import { CHART_DATA, CHART_TITLE, CHART_ARIA_LABEL, CHART_DESCRIPTION } from '../chart.tokens';

interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule, ChartTooltipComponent, TranslateModule],
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
})
export class LineChartComponent implements OnInit, OnChanges {
  @Output() dataPointClick = new EventEmitter<ChartData>();
  @Input() data: ChartData[] = inject(CHART_DATA, { optional: true }) || [];
  @Input() title: string = inject(CHART_TITLE, { optional: true }) || '';
  @Input() ariaLabel: string = inject(CHART_ARIA_LABEL, { optional: true }) || 'Line chart';
  @Input() chartDescription: string = inject(CHART_DESCRIPTION, { optional: true }) || 'Line chart showing data';

  chartData: ChartData[] = [];
  chartWidth: number = 400;
  chartHeight: number = 300;
  padding: number = 40;

  linePath: string = '';
  dataPoints: { x: number; y: number }[] = [];
  gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  // Tooltip properties
  tooltipVisible = false;
  tooltipData: TooltipData | null = null;
  tooltipTop = '0px';
  tooltipInlineOffset = '0px';

  ngOnInit(): void {
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.processData();
    }
  }

  private processData(): void {
    this.chartData = [...this.data];
    this.generateChart();
  }

  private generateChart(): void {
    if (this.chartData.length === 0) {
      this.linePath = '';
      this.dataPoints = [];
      this.gridLines = [];
      return;
    }

    // Calculate value range
    const values = this.chartData.map((item) => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1; // Avoid division by zero

    // Calculate x positions
    const xStep =
      (this.chartWidth - 2 * this.padding) / (this.chartData.length - 1);

    // Generate data points
    this.dataPoints = this.chartData.map((item, index) => {
      const x = this.padding + index * xStep;
      const y =
        this.chartHeight -
        this.padding -
        ((item.value - minValue) / valueRange) *
          (this.chartHeight - 2 * this.padding);
      return { x, y };
    });

    // Generate line path
    if (this.dataPoints.length > 0) {
      let path = `M ${this.dataPoints[0].x} ${this.dataPoints[0].y}`;
      for (let i = 1; i < this.dataPoints.length; i++) {
        path += ` L ${this.dataPoints[i].x} ${this.dataPoints[i].y}`;
      }
      this.linePath = path;
    }

    // Generate grid lines
    this.generateGridLines(minValue, maxValue);
  }

  private generateGridLines(minValue: number, maxValue: number): void {
    this.gridLines = [];

    // Horizontal grid lines
    const numLines = 5;
    const valueStep = (maxValue - minValue) / (numLines - 1);

    for (let i = 0; i < numLines; i++) {
      const value = minValue + i * valueStep;
      const y =
        this.chartHeight -
        this.padding -
        ((value - minValue) / (maxValue - minValue)) *
          (this.chartHeight - 2 * this.padding);

      this.gridLines.push({
        x1: this.padding,
        y1: y,
        x2: this.chartWidth - this.padding,
        y2: y,
      });
    }

    // Vertical grid lines
    for (let i = 0; i < this.chartData.length; i++) {
      const x =
        this.padding +
        i *
          ((this.chartWidth - 2 * this.padding) / (this.chartData.length - 1));

      this.gridLines.push({
        x1: x,
        y1: this.padding,
        x2: x,
        y2: this.chartHeight - this.padding,
      });
    }
  }

  getViewBox(): string {
    return `0 0 ${this.chartWidth} ${this.chartHeight}`;
  }

  // Tooltip event handlers
  onDataPointHover(event: MouseEvent, dataPoint: ChartData) {
    this.tooltipData = {
      label: dataPoint.name,
      value: dataPoint.value,
      color: 'var(--ion-color-primary)', // Line chart has a single color
    };
    this.tooltipVisible = true;
    this.updateTooltipPosition(event);
  }

  onMouseMove(event: MouseEvent) {
    if (this.tooltipVisible) {
      this.updateTooltipPosition(event);
    }
  }

  onDataPointClick(dataPoint: ChartData): void {
    this.dataPointClick.emit(dataPoint);
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
}
