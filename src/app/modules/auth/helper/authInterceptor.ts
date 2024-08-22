import { HttpHandler, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../../../shared/services';

@Injectable()
export class AuthInterceptor extends BaseService implements HttpInterceptor {
  constructor() {
    super();
  }

  intercept(req: any, next: HttpHandler): Observable<any> {
    // get the tokens from the token service
    const accessToken = this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();
    const userId = this.tokenService.getUserId();

    // clone the request and add the headers
    const authReq = req.clone({
      setHeaders: {
        'access-token': accessToken,
        'refresh-token': refreshToken,
        _id: userId,
      },
    });

    // send the modified request
    return next.handle(authReq);
  }
}
