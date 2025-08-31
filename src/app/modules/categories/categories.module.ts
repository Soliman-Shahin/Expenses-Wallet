import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { AddFabButtonComponent } from 'src/app/shared/ui/add-fab-button/add-fab-button.component';
import { SkeletonBlockComponent } from 'src/app/shared/ui/skeleton-block/skeleton-block.component';
import { UiInputComponent } from 'src/app/shared/ui/ui-input/ui-input.component';
import { CategoriesRoutingModule } from './categories.routing.module';
import { AddCategoryComponent, CategoriesComponent } from './components';
import { ColorSelectorComponent, IconSelectorComponent } from './containers';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    IonicModule,
    CategoriesRoutingModule,
    ColorSelectorComponent,
    IconSelectorComponent,
    SkeletonBlockComponent,
    AddFabButtonComponent,
    UiInputComponent,
  ],
  declarations: [CategoriesComponent, AddCategoryComponent],
  providers: [],
})
export class CategoriesModule {}
