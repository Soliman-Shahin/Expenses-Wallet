import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { APP_ROUTES } from './core/constants';

const routes: Routes = [
  {
    path: APP_ROUTES.HOME,
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: APP_ROUTES.AUTH.INDEX,
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: APP_ROUTES.CATEGORIES.INDEX,
    loadChildren: () =>
      import('./modules/categories/categories.module').then(
        (m) => m.CategoriesModule
      ),
  },
  {
    path: '',
    redirectTo: APP_ROUTES.HOME,
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: APP_ROUTES.HOME,
  },
];

@NgModule({
  imports: [
    IonicModule.forRoot(), // Initialize Ionic components and services
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
