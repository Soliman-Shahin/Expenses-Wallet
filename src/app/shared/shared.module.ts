import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  DateTimeComponent,
  MonthsScrollHeaderComponent,
  TotalSalaryComponent,
  UserInfoComponent,
  BalanceCardComponent,
} from './components';
import { CardComponent } from './ui/card/card.component';
import { ListItemComponent } from './ui/list-item/list-item.component';
import { EmptyStateComponent } from './ui/empty-state/empty-state.component';
import { ChartWrapperComponent } from './ui/chart-wrapper/chart-wrapper.component';
import { SkeletonBlockComponent } from './ui/skeleton-block/skeleton-block.component';
import { ButtonComponent } from './ui/button/button.component';

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
    CardComponent,
    ListItemComponent,
    EmptyStateComponent,
    ChartWrapperComponent,
    SkeletonBlockComponent,
    ButtonComponent,
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
    TotalSalaryComponent,
    ThemeToggleComponent,
    BalanceCardComponent,
    CardComponent,
    ListItemComponent,
    EmptyStateComponent,
    ChartWrapperComponent,
    SkeletonBlockComponent,
    ButtonComponent,
  ],
  declarations: [
    UserInfoComponent,
    DateTimeComponent,
    MonthsScrollHeaderComponent,
    TotalSalaryComponent,
    ThemeToggleComponent,
    BalanceCardComponent,
  ],
})
export class SharedModule {}
