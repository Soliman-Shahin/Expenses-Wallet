import { HttpInterceptor, HttpHandler } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private tokenService: TokenService) {}

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
