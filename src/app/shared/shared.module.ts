import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { UserInfoComponent } from './components';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule.forRoot(),
    RouterModule.forChild([]),
    TranslateModule.forChild(),
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    UserInfoComponent,
    TranslateModule,
  ],
  declarations: [ UserInfoComponent],
})
export class SharedModule {}
