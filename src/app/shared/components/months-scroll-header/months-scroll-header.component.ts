import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  QueryList,
  TrackByFunction,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'app-months-scroll-header',
  templateUrl: './months-scroll-header.component.html',
  styleUrls: ['./months-scroll-header.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MonthsScrollHeaderComponent implements OnInit {
  @Output() month = new EventEmitter<{ month: number; year: number }>();

  months: { month: number; year: number }[] = [];
  activeMonthIndex = new Date().getMonth();

  @ViewChildren('monthCard', { read: ElementRef })
  monthCards!: QueryList<ElementRef>;
  trackByMonth!: TrackByFunction<{ month: number; year: number }>;

  constructor(private cdr: ChangeDetectorRef) {
    this.generateMonths();
  }

  private generateMonths() {
    const currentYear = new Date().getFullYear();
    this.months = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      year: currentYear,
    }));
  }

  ngOnInit() {
    this.scrollToActiveMonth();
  }

  selectMonth(index: number, month: { month: number; year: number }) {
    if (index !== this.activeMonthIndex) {
      this.activeMonthIndex = index;
      this.cdr.detectChanges();
      this.scrollToActiveMonth();
      this.month.emit(month);
    }
  }

  private scrollToActiveMonth() {
    const activeMonth = this.months[this.activeMonthIndex];
    this.month.emit(activeMonth);
    const activeCard = this.monthCards.toArray()[this.activeMonthIndex];
    if (activeCard) {
      activeCard.nativeElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
      });
    } else {
      console.warn(`Active card at index ${this.activeMonthIndex} not found.`);
    }
  }
}
