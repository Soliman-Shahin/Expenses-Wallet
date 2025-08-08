import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from './../shared/shared.module';

import {
  HomePageComponent,
  TransactionsComponent,
  ExpenseFormComponent,
} from './components';
import { HomeRoutingModule } from './home-routing.module';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BarChartComponent } from 'src/app/shared/components/charts';
import { PieChartComponent } from 'src/app/shared/components/charts';
import { LineChartComponent } from 'src/app/shared/components/charts';

@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
    SharedModule,
    IonicModule,
    ReactiveFormsModule,
    TranslateModule,
    BarChartComponent,
    PieChartComponent,
    LineChartComponent,
  ],
  declarations: [
    HomePageComponent,
    TransactionsComponent,
    ExpenseFormComponent,
  ],
})
export class HomePageModule {}
