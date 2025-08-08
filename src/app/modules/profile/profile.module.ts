import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProfilePageComponent } from './components';
import { UiInputComponent } from 'src/app/shared/ui/ui-input/ui-input.component';
import { ProfileRoutingModule } from './profile.routing.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    TranslateModule,
    SharedModule,
    ProfileRoutingModule,
    UiInputComponent,
  ],
  declarations: [ProfilePageComponent],
})
export class ProfileModule {}
