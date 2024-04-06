import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent, UserInfoComponent } from './components';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [CommonModule, IonicModule.forRoot(), TranslateModule.forChild()],
  exports: [MenuComponent, UserInfoComponent],
  declarations: [MenuComponent, UserInfoComponent],
})
export class SharedModule {}
