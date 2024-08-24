import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from './../shared/shared.module';

import { HomePageComponent } from './components';
import { HomePageRoutingModule } from './home-routing.module';

@NgModule({
  imports: [
    CommonModule,
    HomePageRoutingModule,
    SharedModule,
  ],
  declarations: [HomePageComponent],
})
export class HomePageModule {}
