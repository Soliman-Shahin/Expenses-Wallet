import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-balance-card',
  templateUrl: './balance-card.component.html',
  styleUrls: ['./balance-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BalanceCardComponent {
  showBalance: boolean = true;
  totalBalance: number = 1000;
  income: number = 4000;
  outcome: number = 3000;
  currency: string = 'EGP';

  get formattedBalance(): string {
    return this.showBalance ? `${this.totalBalance} ${this.currency}` : '*****';
  }

  get formattedIncome(): string {
    return this.showBalance ? `${this.income} ${this.currency}` : '*****';
  }

  get formattedOutcome(): string {
    return this.showBalance ? `${this.outcome} ${this.currency}` : '*****';
  }

  toggleBalance(): void {
    this.showBalance = !this.showBalance;
  }
}
