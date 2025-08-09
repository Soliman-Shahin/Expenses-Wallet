import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  BalanceCardComponent,
  DateTimeComponent,
  MonthsScrollHeaderComponent,
  TotalSalaryComponent,
  UserInfoComponent,
} from './components';

import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule.forRoot(),
    RouterModule.forChild([]),
    TranslateModule.forChild(),
    DatePipe,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    UserInfoComponent,
    TranslateModule,
    DateTimeComponent,
    MonthsScrollHeaderComponent,
    BalanceCardComponent,
    TotalSalaryComponent,
    ThemeToggleComponent,
  ],
  declarations: [
    UserInfoComponent,
    DateTimeComponent,
    MonthsScrollHeaderComponent,
    BalanceCardComponent,
    TotalSalaryComponent,
    ThemeToggleComponent,
  ],
})
export class SharedModule {}
