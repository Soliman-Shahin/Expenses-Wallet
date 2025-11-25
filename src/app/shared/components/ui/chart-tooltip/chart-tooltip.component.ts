import {
  Component,
  Input,
  ChangeDetectionStrategy,
  HostBinding,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
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
export class ChartTooltipComponent implements OnChanges {
  @Input() data: TooltipData | null = null;
  @Input() visible: boolean = false;
  @Input() x: number = 0;
  @Input() y: number = 0;

  @HostBinding('style.transform')
  transform: string = 'translate(-50%, -100%)';

  @HostBinding('style.top.px')
  top: number = 0;

  @HostBinding('style.left.px')
  left: number = 0;

  @HostBinding('class.tooltip-visible')
  get isVisible() {
    return this.visible;
  }

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['x'] || changes['y'] || changes['visible']) && this.visible) {
      this.updatePosition(this.x, this.y);
    }
  }

  private updatePosition(x: number, y: number): void {
    const tooltipElement = this.el.nativeElement;
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    const offsetX = 0;
    const offsetY = -20;

    let newLeft = x + offsetX;
    let newTop = y + offsetY;
    let newTransform = '';

    // Adjust horizontal position to stay within the viewport
    if (newLeft - tooltipRect.width / 2 < 10) {
      newLeft = 10;
      newTransform += 'translateX(0) ';
    } else if (newLeft + tooltipRect.width / 2 > viewportWidth - 10) {
      newLeft = viewportWidth - 10;
      newTransform += 'translateX(-100%) ';
    } else {
      newTransform += 'translateX(-50%) ';
    }

    // Adjust vertical position to stay within the viewport
    if (newTop - tooltipRect.height < 10) {
      newTop = y + 20; // Flip to below the cursor
      newTransform += 'translateY(0)';
    } else {
      newTransform += 'translateY(-100%)';
    }

    this.left = newLeft;
    this.top = newTop;
    this.transform = newTransform.trim();
  }
}
