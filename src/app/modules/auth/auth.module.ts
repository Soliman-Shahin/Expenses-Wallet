import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthRoutingModule } from './auth.routing.module';
import { LoginComponent, SignupComponent } from './components';
import { AuthService } from './services';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    AuthRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    RouterModule,
    IonicModule,
    TranslateModule,
  ],
  declarations: [LoginComponent, SignupComponent],

})
export class AuthModule {}
