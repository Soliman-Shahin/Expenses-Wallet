import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  AddCategoryComponent,
  CategoriesComponent,
  HomePageComponent,
  PhoneLoginComponent,
} from './components';

const routes: Routes = [
  { path: '', redirectTo: 'app', pathMatch: 'full' },
  {
    path: 'app',
    component: HomePageComponent,
  },
  {
    path: 'login',
    component: PhoneLoginComponent,
  },
  {
    path: 'categories',
    component: CategoriesComponent,
  },
  {
    path: 'add',
    component: AddCategoryComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
