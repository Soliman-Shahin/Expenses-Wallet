import { HttpHandler, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { BaseService } from '../../../shared/services';

@Injectable()
export class ErrorInterceptor extends BaseService implements HttpInterceptor {
  constructor() {
    super();
  }

  intercept(req: any, next: HttpHandler): Observable<any> {
    // pass the request to the next handler and catch any errors
    return next.handle(req).pipe(
      catchError((error) => {
        // if the error status is 500, try to refresh the access token
        if (error.status === 500) {
          return this.authService.getNewAccessToken().pipe(
            switchMap((res: any) => {
              // if successful, save the new access token and retry the original request
              this.tokenService.setAccessToken(res.headers.get('access-token'));
              const retryReq = req.clone({
                setHeaders: {
                  'access-token': this.tokenService.getAccessToken(),
                },
              });
              return next.handle(retryReq);
            })
          );
        } else {
          // otherwise, throw the error as usual
          return throwError(error);
        }
      })
    );
  }
}
