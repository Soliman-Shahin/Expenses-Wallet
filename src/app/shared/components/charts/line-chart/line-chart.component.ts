import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" [attr.aria-label]="ariaLabel">
      <h3 *ngIf="title" class="chart-title">{{ title }}</h3>
      <div class="chart-wrapper" role="img" [attr.aria-label]="chartDescription">
        <div class="line-chart">
          <svg [attr.viewBox]="getViewBox()" xmlns="http://www.w3.org/2000/svg">
            <!-- Grid lines -->
            <g class="grid-lines">
              <line 
                *ngFor="let line of gridLines" 
                [attr.x1]="line.x1" 
                [attr.y1]="line.y1" 
                [attr.x2]="line.x2" 
                [attr.y2]="line.y2"
                class="grid-line"
              />
            </g>
            
            <!-- Axes -->
            <line 
              [attr.x1]="padding" 
              [attr.y1]="chartHeight - padding" 
              [attr.x2]="chartWidth - padding" 
              [attr.y2]="chartHeight - padding"
              class="axis"
            />
            <line 
              [attr.x1]="padding" 
              [attr.y1]="padding" 
              [attr.x2]="padding" 
              [attr.y2]="chartHeight - padding"
              class="axis"
            />
            
            <!-- Line path -->
            <path 
              [attr.d]="linePath"
              class="line-path"
              [attr.aria-label]="'Line chart showing trends over time'"
              role="img"
            />
            
            <!-- Data points -->
            <circle 
              *ngFor="let point of dataPoints; let i = index" 
              [attr.cx]="point.x" 
              [attr.cy]="point.y" 
              r="4"
              class="data-point"
              [attr.aria-label]="chartData[i].name + ': ' + chartData[i].value"
              role="img"
            />
            
            <!-- Value labels -->
            <text 
              *ngFor="let point of dataPoints; let i = index" 
              [attr.x]="point.x" 
              [attr.y]="point.y - 10" 
              class="value-label"
              text-anchor="middle"
            >
              {{ chartData[i].value | number:'1.0-0' }}
            </text>
            
            <!-- X-axis labels -->
            <text 
              *ngFor="let point of dataPoints; let i = index" 
              [attr.x]="point.x" 
              [attr.y]="chartHeight - padding + 20" 
              class="axis-label"
              text-anchor="middle"
            >
              {{ chartData[i].name }}
            </text>
          </svg>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnChanges {
  @Input() data: ChartData[] = [];
  @Input() title: string = '';
  @Input() ariaLabel: string = 'Line chart';
  @Input() chartDescription: string = 'Line chart visualization';
  
  chartData: ChartData[] = [];
  chartWidth: number = 400;
  chartHeight: number = 300;
  padding: number = 40;
  
  linePath: string = '';
  dataPoints: {x: number, y: number}[] = [];
  gridLines: {x1: number, y1: number, x2: number, y2: number}[] = [];
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.chartData = [...this.data];
      this.generateChart();
    }
  }
  
  private generateChart(): void {
    if (this.chartData.length === 0) {
      this.linePath = '';
      this.dataPoints = [];
      this.gridLines = [];
      return;
    }
    
    // Calculate value range
    const values = this.chartData.map(item => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1; // Avoid division by zero
    
    // Calculate x positions
    const xStep = (this.chartWidth - 2 * this.padding) / (this.chartData.length - 1);
    
    // Generate data points
    this.dataPoints = this.chartData.map((item, index) => {
      const x = this.padding + index * xStep;
      const y = this.chartHeight - this.padding - 
                ((item.value - minValue) / valueRange) * (this.chartHeight - 2 * this.padding);
      return {x, y};
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
      const y = this.chartHeight - this.padding - 
                ((value - minValue) / (maxValue - minValue)) * (this.chartHeight - 2 * this.padding);
      
      this.gridLines.push({
        x1: this.padding,
        y1: y,
        x2: this.chartWidth - this.padding,
        y2: y
      });
    }
    
    // Vertical grid lines
    for (let i = 0; i < this.chartData.length; i++) {
      const x = this.padding + i * ((this.chartWidth - 2 * this.padding) / (this.chartData.length - 1));
      
      this.gridLines.push({
        x1: x,
        y1: this.padding,
        x2: x,
        y2: this.chartHeight - this.padding
      });
    }
  }
  
  getViewBox(): string {
    return `0 0 ${this.chartWidth} ${this.chartHeight}`;
  }
}
