import { Injector } from '@angular/core';
import {
  CHART_DATA,
  CHART_TITLE,
  CHART_ARIA_LABEL,
  CHART_DESCRIPTION,
  CHART_SHOW_LEGEND,
  CHART_SIZE,
} from 'src/app/shared/components/charts/chart.tokens';
import { HomePageComponent } from './home-page.component';

export function createInjectors(this: HomePageComponent, vm: any): void {
  this.barChartInjector = Injector.create({
    providers: [
      { provide: CHART_DATA, useValue: vm?.incomeVsExpense || [] },
      { provide: CHART_TITLE, useValue: 'HOME.INCOME_VS_EXPENSES' },
      {
        provide: CHART_ARIA_LABEL,
        useValue: 'HOME.INCOME_VS_EXPENSES_CHART',
      },
      {
        provide: CHART_DESCRIPTION,
        useValue: 'HOME.INCOME_VS_EXPENSES_DESC',
      },
    ],
    parent: this['_injector'],
  });

  this.pieChartInjector = Injector.create({
    providers: [
      { provide: CHART_DATA, useValue: vm?.expenseByCategory || [] },
      { provide: CHART_TITLE, useValue: 'HOME.EXPENSE_BY_CATEGORY' },
      {
        provide: CHART_ARIA_LABEL,
        useValue: 'HOME.EXPENSE_BY_CATEGORY_CHART',
      },
      { provide: CHART_SHOW_LEGEND, useValue: true },
      { provide: CHART_SIZE, useValue: 250 },
    ],
    parent: this['_injector'],
  });

  this.lineChartInjector = Injector.create({
    providers: [
      { provide: CHART_DATA, useValue: vm?.monthlyExpenses || [] },
      { provide: CHART_TITLE, useValue: 'HOME.MONTHLY_EXPENSES' },
      {
        provide: CHART_ARIA_LABEL,
        useValue: 'HOME.MONTHLY_EXPENSES_CHART',
      },
      {
        provide: CHART_DESCRIPTION,
        useValue: 'HOME.MONTHLY_EXPENSES_DESC',
      },
    ],
    parent: this['_injector'],
  });

  this.salaryBreakdownPieChartInjector = Injector.create({
    providers: [
      { provide: CHART_DATA, useValue: vm?.salaryBreakdown || [] },
      { provide: CHART_TITLE, useValue: 'HOME.SALARY_BREAKDOWN' },
      {
        provide: CHART_ARIA_LABEL,
        useValue: 'HOME.SALARY_BREAKDOWN_CHART',
      },
      { provide: CHART_SHOW_LEGEND, useValue: false },
      { provide: CHART_SIZE, useValue: 250 },
    ],
    parent: this['_injector'],
  });
}
