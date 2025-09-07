import {
  Component, Input, OnInit, inject, OnChanges, SimpleChanges, Output, EventEmitter, ElementRef, ViewChild, OnDestroy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
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
export class LineChartComponent implements OnInit, OnChanges, OnDestroy {
  @Output() dataPointClick = new EventEmitter<ChartData>();
  @Input() data: ChartData[] = inject(CHART_DATA, { optional: true }) || [];
  @Input() title: string = inject(CHART_TITLE, { optional: true }) || '';
  @Input() ariaLabel: string = inject(CHART_ARIA_LABEL, { optional: true }) || 'Line chart';
  @Input() chartDescription: string = inject(CHART_DESCRIPTION, { optional: true }) || 'Line chart showing data';
  @Input() yAxisTicks = 5;
  @Input() animationDuration = 1000; // ms

  @ViewChild('chartWrapper', { static: true }) chartWrapper!: ElementRef<HTMLDivElement>;

  chartData: ChartData[] = [];
  chartWidth = 500;
  chartHeight = 300;
  padding = { top: 50, right: 80, bottom: 80, left: 80 };

  linePath = '';
  areaPath = '';
  dataPoints: { x: number; y: number }[] = [];
  gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  xAxisLabels: { x: number; value: string }[] = [];
  yAxisLabels: { y: number; value: string; x: number; anchor: string }[] = [];
  pointXStep = 0;
  dynamicAxisLabelFontSize = 14;
  dynamicValueLabelFontSize = 16;

  activePointIndex: number | null = null;
  tooltipVisible = false;
  tooltipData: TooltipData | null = null;
  tooltipX = 0;
  tooltipY = 0;

  private animationFrameId: number | null = null;
  private cdr = inject(ChangeDetectorRef);
  private document = inject(DOCUMENT);

  ngOnInit(): void {
    this.processData(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.processData(true);
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private processData(animate = false): void {
    const isRtl = this.document.documentElement.dir === 'rtl';
    this.chartData = isRtl ? [...(this.data || [])].reverse() : [...(this.data || [])];
    if (animate) {
      this.animateChart();
    } else {
      this.generateChart(1);
    }
  }

  private animateChart(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      let progress = elapsedTime / this.animationDuration;
      if (progress > 1) progress = 1;

      this.generateChart(easeOutCubic(progress));
      this.cdr.detectChanges();

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
      }
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private generateChart(progress = 1): void {
    this.chartHeight = this.chartWidth * 0.6; // Make height responsive to width
    if (this.chartData.length === 0) {
      this.linePath = '';
      this.areaPath = '';
      this.dataPoints = [];
      return;
    }

    const minPointSpacing = 50;
    const requiredWidth = this.padding.left + this.padding.right + (this.chartData.length - 1) * minPointSpacing;
    const clientWidth = this.chartWrapper.nativeElement.clientWidth;
    this.chartWidth = Math.max(clientWidth, requiredWidth);

    // Dynamically adjust font size to counteract SVG scaling
    const scale = clientWidth < this.chartWidth ? clientWidth / this.chartWidth : 1;
    this.dynamicAxisLabelFontSize = 12 / scale;
    this.dynamicValueLabelFontSize = 14 / scale;

    const values = this.chartData.map(d => d.value);
    const yMin = 0; // Start y-axis at 0 for better context
    const yMax = Math.max(...values) * 1.1; // Add 10% padding to max value

    const yRange = yMax - yMin || 1;
    const xRange = this.chartWidth - this.padding.left - this.padding.right;
    this.pointXStep = this.chartData.length > 1 ? xRange / (this.chartData.length - 1) : xRange;

    this.dataPoints = this.chartData.map((item, index) => {
      const x = this.padding.left + index * this.pointXStep;
      const yRatio = (item.value - yMin) / yRange;
      const y = this.chartHeight - this.padding.bottom - (yRatio * (this.chartHeight - this.padding.top - this.padding.bottom)) * progress;
      return { x, y };
    });

    this.generatePaths();
    this.generateLabelsAndGrid(yMin, yMax);
  }

  private generatePaths(): void {
    if (this.dataPoints.length < 2) {
      this.linePath = `M ${this.dataPoints[0].x},${this.dataPoints[0].y}`;
      this.areaPath = '';
      return;
    }
    this.linePath = this.createSmoothedLine(this.dataPoints);
    this.areaPath = `${this.linePath} L ${this.dataPoints[this.dataPoints.length - 1].x},${this.chartHeight - this.padding.bottom} L ${this.dataPoints[0].x},${this.chartHeight - this.padding.bottom} Z`;
  }

  private generateLabelsAndGrid(yMin: number, yMax: number): void {
    const isMobile = window.innerWidth < 768;
    const maxLabels = isMobile ? 4 : 12; // Max number of labels to show
    const totalPoints = this.chartData.length;
    let labelDensity = 1;
    if (totalPoints > maxLabels) {
      labelDensity = Math.ceil(totalPoints / maxLabels);
    }

    this.xAxisLabels = this.chartData
      .map((item, index) => ({
        x: this.padding.left + index * this.pointXStep,
        value: item.name,
      }))
      .filter((_, index) => {
        // Always show the first label, then apply density
        if (index === 0) return true;
        return index % labelDensity === 0;
      });

    this.yAxisLabels = [];
    this.gridLines = [];
    const yRange = yMax - yMin;
    const isRtl = this.document.documentElement.dir === 'rtl';

    for (let i = 0; i <= this.yAxisTicks; i++) {
      const value = yMin + (yRange / this.yAxisTicks) * i;
      const y = this.chartHeight - this.padding.bottom - (i / this.yAxisTicks) * (this.chartHeight - this.padding.top - this.padding.bottom);
      
      const labelX = isRtl ? this.chartWidth - this.padding.right + 15 : this.padding.left - 15;
      const anchor = isRtl ? 'start' : 'end';

      this.yAxisLabels.push({ y, value: this.formatYAxisLabel(value), x: labelX, anchor });
      this.gridLines.push({ x1: this.padding.left, y1: y, x2: this.chartWidth - this.padding.right, y2: y });
    }
  }

  getViewBox(): string {
    return `0 0 ${this.chartWidth} ${this.chartHeight}`;
  }

  onMouseMove(event: MouseEvent | TouchEvent): void {
    if (this.animationFrameId || !this.dataPoints.length) return;

    const svgElement = event.currentTarget as SVGSVGElement;
    const svgRect = svgElement.getBoundingClientRect();
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    // This is the mouse's X position relative to the SVG element's left edge.
    const mouseX = clientX - svgRect.left;

    // Calculate the scaling factor of the rendered SVG compared to its internal viewBox width.
    const scale = svgRect.width / this.chartWidth;

    // Find the closest point by iterating and checking the rendered horizontal distance.
    let closestPointIndex = 0;
    let minDistance = Infinity;

    this.dataPoints.forEach((point, index) => {
      // Calculate the rendered X position of the data point.
      const renderedPointX = point.x * scale;
      const distance = Math.abs(renderedPointX - mouseX);

      if (distance < minDistance) {
        minDistance = distance;
        closestPointIndex = index;
      }
    });

    // Update active point and tooltip data if it has changed.
    if (this.activePointIndex !== closestPointIndex) {
      this.activePointIndex = closestPointIndex;
      const activePointData = this.chartData[closestPointIndex];
      if (activePointData) {
        this.tooltipData = { label: activePointData.name, value: activePointData.value, color: 'var(--line-color)' };
      }
    }

    // Position the tooltip.
    const activePointCoords = this.dataPoints[closestPointIndex];
    if (activePointCoords) {
      this.tooltipVisible = true;
      // The tooltip component has its own logic to position itself based on raw clientX/Y.
      // We just need to provide the coordinates from the original mouse/touch event.
      this.tooltipX = clientX;
      this.tooltipY = clientY;
    }
  }

  onMouseLeave(): void {
    this.activePointIndex = null;
    this.tooltipVisible = false;
  }

  onDataPointClick(dataPoint: ChartData): void {
    this.dataPointClick.emit(dataPoint);
  }

  private formatYAxisLabel(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  }

  private createSmoothedLine(points: { x: number; y: number }[]): string {
    const line = (pointA: any, pointB: any) => {
      const lengthX = pointB.x - pointA.x;
      const lengthY = pointB.y - pointA.y;
      return { length: Math.sqrt(lengthX ** 2 + lengthY ** 2), angle: Math.atan2(lengthY, lengthX) };
    };

    const controlPoint = (current: any, previous: any, next: any, reverse?: boolean) => {
      const p = previous || current;
      const n = next || current;
      const smoothing = 0.2;
      const o = line(p, n);
      const angle = o.angle + (reverse ? Math.PI : 0);
      const length = o.length * smoothing;
      return [current.x + Math.cos(angle) * length, current.y + Math.sin(angle) * length];
    };

    const bezierCommand = (point: any, i: number, a: any[]) => {
      const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
      const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
      return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point.x},${point.y}`;
    };

    return points.reduce((acc, point, i, a) => i === 0 ? `M ${point.x},${point.y}` : `${acc} ${bezierCommand(point, i, a)}`, '');
  }
}
