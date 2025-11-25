import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DateRange = '1m' | '6m' | '1y' | 'all';

@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-range-selector.component.html',
  styleUrls: ['./date-range-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeSelectorComponent {
  @Output() rangeChange = new EventEmitter<DateRange>();

  ranges: { value: DateRange; label: string }[] = [
    { value: '1m', label: '1M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: 'all', label: 'All' },
  ];

  selectedRange: DateRange = '6m';

  selectRange(range: DateRange): void {
    this.selectedRange = range;
    this.rangeChange.emit(range);
  }
}
