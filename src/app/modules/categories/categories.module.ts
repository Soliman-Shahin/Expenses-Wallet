import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { CategoriesRoutingModule } from './categories.routing.module';
import { AddCategoryComponent, CategoriesComponent } from './components';
import { ColorSelectorComponent, IconSelectorComponent } from './containers';

@NgModule({
  imports: [CommonModule, SharedModule, CategoriesRoutingModule, ColorSelectorComponent, IconSelectorComponent],
  declarations: [CategoriesComponent, AddCategoryComponent],
  providers: [],
})
export class CategoriesModule {}
