import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { APP_ROUTES } from 'src/app/core/constants';
import { AddCategoryComponent, CategoriesComponent } from './components';

const categoriesRoutes: Routes = [
  {
    path: APP_ROUTES.CATEGORIES.LIST,
    component: CategoriesComponent,
  },
  {
    path: APP_ROUTES.CATEGORIES.CREATE,
    component: AddCategoryComponent,
  },
];

@NgModule({
  imports: [
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        children: categoriesRoutes,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class CategoriesRoutingModule {}
