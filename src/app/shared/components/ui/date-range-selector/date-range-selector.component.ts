import { Component, EventEmitter, Output, Input, ChangeDetectionStrategy } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

export type DateRange = '1m' | '6m' | '1y' | 'all';

@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './date-range-selector.component.html',
  styleUrls: ['./date-range-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeSelectorComponent {
  @Input() selectedRange: DateRange = '6m';
  @Output() rangeChange = new EventEmitter<DateRange>();

  ranges: { value: DateRange; label: string }[] = [
    { value: '1m', label: 'DATE_RANGE.1M' },
    { value: '6m', label: 'DATE_RANGE.6M' },
    { value: '1y', label: 'DATE_RANGE.1Y' },
    { value: 'all', label: 'DATE_RANGE.ALL' },
  ];

  selectRange(range: DateRange): void {
    this.selectedRange = range;
    this.rangeChange.emit(range);
  }
}
