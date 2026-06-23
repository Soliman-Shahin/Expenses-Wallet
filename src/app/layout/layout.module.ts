import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { SideMenuComponent, TabsBarComponent } from './components';
import { LayoutComponent } from './pages';

@NgModule({
    imports: [CommonModule, SharedModule, TabsBarComponent, SideMenuComponent, LayoutComponent],
    exports: [LayoutComponent],
})
export class LayoutModule {}
