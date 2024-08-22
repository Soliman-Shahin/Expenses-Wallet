import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from './../shared/shared.module';

import { TranslateModule } from '@ngx-translate/core';
import { HomePageComponent } from './components';
import { HomePageRoutingModule } from './home-routing.module';

@NgModule({
  imports: [
    CommonModule,
    HomePageRoutingModule,
    TranslateModule.forChild(),
    SharedModule,
  ],
  declarations: [HomePageComponent],
})
export class HomePageModule {}
