import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { CategoriesRoutingModule } from './categories.routing.module';
import { AddCategoryComponent, CategoriesComponent } from './components';
import { CategoriesService } from './services';

@NgModule({
  imports: [CommonModule, SharedModule, CategoriesRoutingModule],
  declarations: [CategoriesComponent, AddCategoryComponent],
  providers: [CategoriesService],
})
export class CategoriesModule {}
