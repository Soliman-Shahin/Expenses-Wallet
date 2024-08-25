import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import {
  HeaderComponent,
  SideMenuComponent,
  TabsBarComponent,
} from './components';
import { LayoutComponent } from './pages';

@NgModule({
  imports: [CommonModule, SharedModule],
  exports: [LayoutComponent],
  declarations: [
    SideMenuComponent,
    HeaderComponent,
    TabsBarComponent,
    LayoutComponent,
  ],
})
export class LayoutModule {}
