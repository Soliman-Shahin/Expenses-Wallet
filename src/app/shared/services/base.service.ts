import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService, TokenService } from 'src/app/modules/auth/services';
import { TranslationService } from './translation.service';

export abstract class BaseService {
  authService = inject(AuthService);
  http = inject(HttpClient);
  router = inject(Router);
  tokenService = inject(TokenService);
  translate = inject(TranslationService);
  toastController = inject(ToastController);
  translateService = inject(TranslateService);

  constructor() {}
}
