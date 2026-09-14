import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { AlertService } from 'src/app/shared/services/alert.service';
import { TokenService } from 'src/app/modules/auth/services/token.service';
import type { ProfilePageComponent } from '../components/profile-page/profile-page.component';

export const profileLeaveGuard: CanDeactivateFn<ProfilePageComponent> = async (
  component
) => {
  if (!inject(TokenService).getAccessToken()) return true;
  return component.confirmLeave(inject(AlertService));
};
