import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent, UserInfoComponent } from './components';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    IonicModule.forRoot(),
    RouterModule.forChild([]),
    TranslateModule.forChild(),
  ],
  exports: [MenuComponent, UserInfoComponent],
  declarations: [MenuComponent, UserInfoComponent],
})
export class SharedModule {}
