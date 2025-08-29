import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from './../shared/shared.module';
import { AddFabButtonComponent } from 'src/app/shared/ui/add-fab-button/add-fab-button.component';

import { ExpenseFormComponent } from './components';
import { HomeRoutingModule } from './home-routing.module';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BarChartComponent } from 'src/app/shared/components/charts';
import { PieChartComponent } from 'src/app/shared/components/charts';
import { LineChartComponent } from 'src/app/shared/components/charts';
import {
  SectionHeaderComponent,
  ActionTileComponent,
  SkeletonBlockComponent,
  EmptyStateComponent,
} from 'src/app/shared/ui';
import { DateRangeSelectorComponent } from 'src/app/shared/components/ui/date-range-selector/date-range-selector.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    IonicModule,
    HomeRoutingModule,
    ReactiveFormsModule,
    TranslateModule,
    BarChartComponent,
    PieChartComponent,
    LineChartComponent,
    SectionHeaderComponent,
    ActionTileComponent,
    SkeletonBlockComponent,
    EmptyStateComponent,
    DateRangeSelectorComponent,
    AddFabButtonComponent,
  ],
  declarations: [ExpenseFormComponent],
})
export class HomePageModule {}
