import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  AddCategoryComponent,
  CategoriesComponent,
  HomePageComponent,
  LoginComponent,
  PhoneLoginComponent,
  SignupComponent,
} from './components';
import { UserInfoComponent } from '../shared/components';

const routes: Routes = [
  { path: '', redirectTo: 'app', pathMatch: 'full' },
  {
    path: 'app',
    component: HomePageComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'signup',
    component: SignupComponent,
  },
  {
    path: 'profile',
    component: UserInfoComponent,
  },
  {
    path: 'login-phone',
    component: PhoneLoginComponent,
  },
  {
    path: 'categories',
    component: CategoriesComponent,
  },
  {
    path: 'add-category',
    component: AddCategoryComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
