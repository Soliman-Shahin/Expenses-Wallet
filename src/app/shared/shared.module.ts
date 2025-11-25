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
  OnboardingComponent,
  BackupRestoreComponent,
} from './components';
import { SkeletonBlockComponent } from './ui/skeleton-block/skeleton-block.component';
import {
  CardComponent,
  ListItemComponent,
  EmptyStateComponent,
  ChartWrapperComponent,
  ButtonComponent,
} from './ui-library';

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
    OnboardingComponent,
    BackupRestoreComponent,
  ],
  declarations: [
    UserInfoComponent,
    DateTimeComponent,
    MonthsScrollHeaderComponent,
    TotalSalaryComponent,
    ThemeToggleComponent,
    BalanceCardComponent,
    OnboardingComponent,
    BackupRestoreComponent,
  ],
})
export class SharedModule {}
