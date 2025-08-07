import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { MonthYear } from 'src/app/home/models';

@Component({
  selector: 'app-months-scroll-header',
  templateUrl: './months-scroll-header.component.html',
  styleUrls: ['./months-scroll-header.component.scss'],
})
export class MonthsScrollHeaderComponent implements OnInit, AfterViewInit {
  @Input() selectedDate: MonthYear | undefined;
  @Input() monthTotals: { [key: string]: number } = {};
  @Output() monthSelected = new EventEmitter<MonthYear>();
  @Output() scrolled = new EventEmitter<{
    isAtStart: boolean;
    isAtEnd: boolean;
  }>();

  @ViewChild('monthsContainer') monthsContainer!: ElementRef;

  months: MonthYear[] = [];

  constructor() {}

  ngOnInit(): void {
    this.generateMonths();
    if (!this.selectedDate) {
      const today = new Date();
      this.selectedDate = {
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      };
    }
  }

  ngAfterViewInit(): void {
    this.scrollToSelected();
  }

  generateMonths(): void {
    const today = new Date();
    const months: MonthYear[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({ month: date.getMonth() + 1, year: date.getFullYear() });
    }
    this.months = months.reverse();
  }

  selectMonth(month: MonthYear): void {
    this.selectedDate = month;
    this.monthSelected.emit(month);
    this.scrollToSelected();
  }

  isSelected(month: MonthYear): boolean {
    if (!this.selectedDate) {
      return false;
    }
    return (
      month.year === this.selectedDate.year &&
      month.month === this.selectedDate.month
    );
  }

  // Helper to create a Date object from MonthYear for the pipe
  getDate(monthYear: MonthYear): Date {
    return new Date(monthYear.year, monthYear.month - 1, 1);
  }

  onScroll(): void {
    this.updateScrollPosition();
  }

  private updateScrollPosition(): void {
    if (!this.monthsContainer) return;

    const container = this.monthsContainer.nativeElement;
    const isAtStart = container.scrollLeft <= 0;
    const isAtEnd =
      container.scrollLeft + container.clientWidth >= container.scrollWidth - 1; // Allow 1px tolerance

    this.scrolled.emit({ isAtStart, isAtEnd });
  }

  private scrollToSelected(): void {
    if (!this.monthsContainer) return;

    const container = this.monthsContainer.nativeElement;
    const selectedElement = container.querySelector('.month-item.selected');

    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }

    // Update scroll position after a short delay to ensure scrolling is complete
    setTimeout(() => this.updateScrollPosition(), 100);
  }
}
