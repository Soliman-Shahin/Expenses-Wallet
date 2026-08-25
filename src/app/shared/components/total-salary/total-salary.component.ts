import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SalaryDetail } from 'src/app/home/models';
import { IonicModule } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-total-salary',
    templateUrl: './total-salary.component.html',
    styleUrls: ['./total-salary.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        IonicModule,
        CurrencyPipe,
        TranslateModule,
    ],
})
export class TotalSalaryComponent {
  // Inputs
  @Input() set month(value: number | null) {
    this._monthSignal.set(value);
  }

  @Input({
    transform: (value: string | number | null | undefined) =>
      value ? +value : null,
  })
  set year(value: number | null) {
    this._yearSignal.set(value);
  }

  @Input() set totalAmount(value: number | null) {
    this._totalAmountSignal.set(value);
  }

  @Input() set details(value: SalaryDetail[]) {
    this._detailsSignal.set(value);
  }

  @Input() isLoading = false;
  @Input() currency: string = 'EGP';
  @Input() showBreakdown = true;

  // Outputs
  @Output() detailClicked = new EventEmitter<SalaryDetail>();
  @Output() totalClicked = new EventEmitter<number>();

  // Signals
  private _monthSignal = signal<number | null>(null);
  private _yearSignal = signal<number | null>(null);
  private _totalAmountSignal = signal<number | null>(null);
  private _detailsSignal = signal<SalaryDetail[]>([]);

  // Computed (different names from inputs)
  currentMonth = computed(() => this._monthSignal());
  currentYear = computed(() => this._yearSignal());
  total = computed(() => this._totalAmountSignal());
  salaryDetails = computed(() => this._detailsSignal());

  monthName = computed(() => {
    const m = this.currentMonth();
    if (m === null) return '';
    const date = new Date(2000, m - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  });

  formattedTotal = computed(() => {
    const total = this.total();
    if (total === null) return '-';
    return `${total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${this.currency}`;
  });

  hasDetails = computed(() => this.salaryDetails().length > 0);
  detailsCount = computed(() => this.salaryDetails().length);

  /**
   * Handle detail click
   */
  onDetailClick(detail: SalaryDetail): void {
    this.detailClicked.emit(detail);
  }

  /**
   * Handle total click
   */
  onTotalClick(): void {
    const total = this.total();
    if (total !== null) {
      this.totalClicked.emit(total);
    }
  }

  /**
   * Format detail amount
   */
  formatDetailAmount(amount: number): string {
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${this.currency}`;
  }

  /**
   * Get detail percentage of total
   */
  getDetailPercentage(amount: number): number {
    const total = this.total();
    if (!total || total === 0) return 0;
    return (amount / total) * 100;
  }
}
