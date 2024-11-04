import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-total-salary',
  templateUrl: './total-salary.component.html',
  styleUrls: ['./total-salary.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TotalSalaryComponent {
  totalSalary = 21000;
  expense = 4800;
  remaining = this.totalSalary - this.expense;
  currency: string = 'EGP';
  // progress from 0 to 1
  public progress = this.expense / this.totalSalary;

  constructor() {}
}
