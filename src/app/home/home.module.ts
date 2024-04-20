import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HomePageRoutingModule } from './home-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import {
  AddCategoryComponent,
  CategoriesComponent,
  HomePageComponent,
  LoginComponent,
  PhoneLoginComponent,
  SignupComponent,
} from './components';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    HomePageRoutingModule,
    TranslateModule.forChild(),
    SharedModule,
  ],
  declarations: [
    HomePageComponent,
    PhoneLoginComponent,
    CategoriesComponent,
    AddCategoryComponent,
    LoginComponent,
    SignupComponent,
  ],
})
export class HomePageModule {}
