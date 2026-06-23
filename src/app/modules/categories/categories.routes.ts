import { Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { APP_ROUTES } from 'src/app/core/constants';
import { AddCategoryComponent, CategoriesComponent } from './components';

export const routes: Routes = [
  {
    path: '',
    redirectTo: APP_ROUTES.CATEGORIES.LIST,
    pathMatch: 'full',
  },
  {
    path: APP_ROUTES.CATEGORIES.LIST,
    component: CategoriesComponent,
    data: {
      title: 'SIDEBAR.CATEGORIES',
      action: 'add',
      icon: 'duplicate',
    },
  },
  {
    path: APP_ROUTES.CATEGORIES.CREATE,
    component: AddCategoryComponent,
    data: { title: 'CATEGORY.ADD', action: 'save', icon: 'save' },
  },
  {
    path: APP_ROUTES.CATEGORIES.EDIT,
    component: AddCategoryComponent,
    data: { title: 'CATEGORY.EDIT', action: 'save', icon: 'save' },
  },
];
