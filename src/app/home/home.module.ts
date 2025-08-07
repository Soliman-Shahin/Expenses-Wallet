import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from './../shared/shared.module';

import { HomePageComponent, TransactionsComponent, ExpenseFormComponent } from './components';
import { HomeRoutingModule } from './home-routing.module';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
    SharedModule,
    IonicModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  declarations: [HomePageComponent, TransactionsComponent, ExpenseFormComponent],
})
export class HomePageModule {}
