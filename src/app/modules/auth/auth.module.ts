import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthRoutingModule } from './auth.routing.module';
import { LoginComponent, SignupComponent } from './components';
import { AuthService } from './services';

@NgModule({
  imports: [
    CommonModule,
    AuthRoutingModule,
    SharedModule,
  ],
  declarations: [LoginComponent, SignupComponent],
  providers: [AuthService],
})
export class AuthModule {}
