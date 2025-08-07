import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-balance-card',
  templateUrl: './balance-card.component.html',
  styleUrls: ['./balance-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BalanceCardComponent {
    @Input() balance: number | null = null;
    @Input() income: number | null = null;
    @Input() expenses: number | null = null;
    @Input() percentageChange: number | null = null;
    @Input() isLoading = false;
    @Input() currency: string = 'EGP';
    
  showBalance: boolean = true;

  get formattedBalance(): string {
    if (!this.showBalance) return '*****';
    if (this.balance === null || this.balance === undefined) return '-';
    return `${this.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${this.currency}`;
  }

  get formattedIncome(): string {
    if (!this.showBalance) return '*****';
    if (this.income === null || this.income === undefined) return '-';
    return `${this.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${this.currency}`;
  }

  get formattedExpenses(): string {
    if (!this.showBalance) return '*****';
    if (this.expenses === null || this.expenses === undefined) return '-';
    return `${this.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${this.currency}`;
  }

  toggleBalance(): void {
    this.showBalance = !this.showBalance;
  }
}
