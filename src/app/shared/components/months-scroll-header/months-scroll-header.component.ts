import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MonthYear } from 'src/app/home/models';

@Component({
  selector: 'app-months-scroll-header',
  templateUrl: './months-scroll-header.component.html',
  styleUrls: ['./months-scroll-header.component.scss'],
})
export class MonthsScrollHeaderComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @Input() selectedDate: MonthYear | undefined;
  @Input() locale: string | undefined;
  @Output() monthSelected = new EventEmitter<MonthYear>();
  @Output() scrolled = new EventEmitter<{
    isAtStart: boolean;
    isAtEnd: boolean;
  }>();

  @ViewChild('monthsContainer') monthsContainer!: ElementRef;

  months: MonthYear[] = [];
  private _didInitialForceCenter = false;
  private _initialForceTries = 0;

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
    // Attempt to center after initial setup
    setTimeout(() => this.scrollToSelected());
  }

  ngAfterViewInit(): void {
    // Defer to next tick to ensure *ngFor has rendered and classes are applied
    setTimeout(() => this.scrollToSelected());
    // One-time hard alignment to guarantee visibility on first paint
    requestAnimationFrame(() =>
      setTimeout(() => this.forceCenterSelectedOnce(), 0)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDate'] && this.selectedDate) {
      // When parent updates or sets the selected date, ensure we reflect it and scroll
      setTimeout(() => this.scrollToSelected());
      // If selectedDate arrives late from parent, ensure we run the force center once
      if (!this._didInitialForceCenter) {
        requestAnimationFrame(() =>
          setTimeout(() => this.forceCenterSelectedOnce(), 0)
        );
      }
    }
  }

  generateMonths(): void {
    const today = new Date();
    const months: MonthYear[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({ month: date.getMonth() + 1, year: date.getFullYear() });
    }
    this.months = months.reverse();
    // Center after months render in the next ticks
    requestAnimationFrame(() => this.scrollToSelected());
    setTimeout(() => this.scrollToSelected(), 0);
    // Ensure a one-time hard center after data is ready
    if (!this._didInitialForceCenter) {
      requestAnimationFrame(() =>
        setTimeout(() => this.forceCenterSelectedOnce(), 0)
      );
    }
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
    if (this.isUserInteracting || this.isAutoScrolling) return; // do not auto-scroll during user interaction or while already auto-scrolling
    const container = this.monthsContainer?.nativeElement;
    if (!container) return;

    const doScroll = () => {
      if (this.isUserInteracting) return; // guard inside deferred callbacks
      if (!container) return;
      if (!this.selectedDate || !this.months || this.months.length === 0) {
        return;
      }
      const index = this.months.findIndex(
        (m) =>
          m.year === this.selectedDate!.year &&
          m.month === this.selectedDate!.month
      );
      if (index < 0) return;

      const child = container.children.item(index) as HTMLElement | null;
      if (!child) return;

      const isRtl = getComputedStyle(container).direction === 'rtl';
      const centerOffset = (container.clientWidth - child.clientWidth) / 2;
      let targetLeft = child.offsetLeft - centerOffset;

      if (isRtl) {
        // Normalize RTL scroll across engines
        const desiredLeftFromLtr = Math.max(0, targetLeft);
        const type = this.getRtlScrollType();
        // Immediate jump
        this.setNormalizedScrollLeft(container, desiredLeftFromLtr, type);
        // Smooth refine
        const smoothLeft = this.getEngineScrollLeft(
          container,
          desiredLeftFromLtr,
          type
        );
        container.scrollTo({ left: smoothLeft, behavior: 'smooth' });
      } else {
        // Immediate jump to ensure visibility on first paint
        container.scrollLeft = Math.max(0, targetLeft);
        // Smooth refine
        container.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: 'smooth',
        });
      }

      // Single lightweight update; avoid repeated retries to prevent fighting the user
      this.scheduleAuto(() => {
        if (!this.isUserInteracting) this.updateScrollPosition();
        this.isAutoScrolling = false;
      }, 140);
    };

    // Try immediately, then defer to next frame and short timeout as a safety net
    this.clearAutoTimers();
    this.isAutoScrolling = true;
    doScroll();
  }

  // Force center the selected month once on first load, bypassing interaction guards and smooth scrolling.
  private forceCenterSelectedOnce(): void {
    if (this._didInitialForceCenter) return;
    const container = this.monthsContainer?.nativeElement as
      | HTMLElement
      | undefined;
    if (!container || !this.selectedDate || !this.months?.length) return;
    // If container not laid out yet (hidden tab or width 0), retry a few times then give up
    if (container.clientWidth === 0) {
      if (this._initialForceTries < 3) {
        this._initialForceTries++;
        setTimeout(() => this.forceCenterSelectedOnce(), 60);
      }
      return;
    }
    const index = this.months.findIndex(
      (m) =>
        m.year === this.selectedDate!.year &&
        m.month === this.selectedDate!.month
    );
    if (index < 0) return;
    const child = container.children.item(index) as HTMLElement | null;
    if (!child || child.clientWidth === 0) {
      if (this._initialForceTries < 3) {
        this._initialForceTries++;
        setTimeout(() => this.forceCenterSelectedOnce(), 60);
      }
      return;
    }
    const isRtl = getComputedStyle(container).direction === 'rtl';
    const centerOffset = (container.clientWidth - child.clientWidth) / 2;
    const targetFromLtr = Math.max(0, child.offsetLeft - centerOffset);
    if (isRtl) {
      const type = this.getRtlScrollType();
      this.setNormalizedScrollLeft(container, targetFromLtr, type);
    } else {
      container.scrollLeft = targetFromLtr;
    }
    // Fallback: if still not fully visible, use scrollIntoView to ensure visibility
    const cRect = container.getBoundingClientRect();
    const mRect = child.getBoundingClientRect();
    const isOutside =
      mRect.left < cRect.left + 4 || mRect.right > cRect.right - 4;
    if (isOutside) {
      try {
        child.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'center' as ScrollLogicalPosition,
        });
      } catch {
        child.scrollIntoView();
      }
    }
    this._didInitialForceCenter = true;
  }

  // --- RTL scroll normalization helpers ---
  private _rtlScrollType: 'default' | 'negative' | 'reverse' | null = null;

  private getRtlScrollType(): 'default' | 'negative' | 'reverse' {
    if (this._rtlScrollType) return this._rtlScrollType;
    if (typeof document === 'undefined')
      return (this._rtlScrollType = 'default');

    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.style.width = '100px';
    outer.style.height = '1px';
    outer.style.overflow = 'scroll';
    outer.style.direction = 'rtl';
    inner.style.width = '200px';
    outer.appendChild(inner);
    document.body.appendChild(outer);

    // Test sequence
    outer.scrollLeft = 0;
    if (outer.scrollLeft > 0) {
      this._rtlScrollType = 'default';
    } else {
      outer.scrollLeft = 1;
      this._rtlScrollType = outer.scrollLeft === 0 ? 'negative' : 'reverse';
    }

    document.body.removeChild(outer);
    return this._rtlScrollType;
  }

  private getEngineScrollLeft(
    el: HTMLElement,
    desiredLeftFromLtr: number,
    type: 'default' | 'negative' | 'reverse'
  ): number {
    const max = el.scrollWidth - el.clientWidth;
    switch (type) {
      case 'negative':
        return -desiredLeftFromLtr;
      case 'reverse':
        return max - desiredLeftFromLtr;
      case 'default':
      default:
        return desiredLeftFromLtr;
    }
  }

  private setNormalizedScrollLeft(
    el: HTMLElement,
    desiredLeftFromLtr: number,
    type: 'default' | 'negative' | 'reverse'
  ): void {
    const val = this.getEngineScrollLeft(el, desiredLeftFromLtr, type);
    (el as any).scrollLeft = val;
  }

  // Accessibility and display helpers

  getAriaLabel(month: MonthYear): string {
    const date = this.getDate(month);
    const dateText = date.toLocaleDateString(this.locale || undefined, {
      month: 'long',
      year: 'numeric',
    });
    return `${dateText}`;
  }

  onKeydown(ev: KeyboardEvent, month: MonthYear): void {
    const key = ev.key;
    if (key === 'Enter' || key === ' ') {
      ev.preventDefault();
      this.selectMonth(month);
    }
  }

  // --- Interaction guards to avoid fighting the user ---
  private isUserInteracting = false;
  private autoTimers: number[] = [];
  private wheelEndTimer: number | null = null;
  private isAutoScrolling = false;

  onPointerDown(): void {
    this.isUserInteracting = true;
    this.clearAutoTimers();
  }

  onPointerUp(): void {
    // allow momentum to finish then re-center
    this.isUserInteracting = false;
    this.clearAutoTimers();
    this.scheduleAuto(() => {
      if (!this.isUserInteracting) {
        this.updateScrollPosition();
      }
    }, 250);
  }

  onUserWheel(): void {
    this.isUserInteracting = true;
    this.clearAutoTimers();
    if (this.wheelEndTimer) {
      clearTimeout(this.wheelEndTimer);
    }
    this.wheelEndTimer = window.setTimeout(() => {
      this.isUserInteracting = false;
      this.updateScrollPosition();
      this.wheelEndTimer = null;
    }, 300);
  }

  private scheduleAuto(fn: () => void, delay: number): void {
    const id = window.setTimeout(fn, delay);
    this.autoTimers.push(id);
  }

  private clearAutoTimers(): void {
    for (const id of this.autoTimers) clearTimeout(id);
    this.autoTimers = [];
  }
}
