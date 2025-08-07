import { Component, Input } from '@angular/core';
import { SalaryDetail } from 'src/app/home/models';

@Component({
  selector: 'app-total-salary',
  templateUrl: './total-salary.component.html',
  styleUrls: ['./total-salary.component.scss'],
})
export class TotalSalaryComponent {
  @Input() month: number | null = null;
  @Input({
    transform: (value: string | number | null | undefined) =>
      value ? +value : null,
  })
  year: number | null = null;
  @Input() totalAmount: number | null = null;
  @Input() details: SalaryDetail[] = [];
  @Input() isLoading = false;
  @Input() currency: string = 'EGP';

  constructor() {}
}
