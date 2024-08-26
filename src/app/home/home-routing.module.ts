import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { APP_ROUTES } from '../core/constants';
import { HomePageComponent } from './components/home-page/home-page.component';

const routes: Routes = [
  {
    path: APP_ROUTES.INDEX,
    component: HomePageComponent,
    data: { title: 'APP_TITLE' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
