import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from '../services/encryption.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class EncryptionInterceptor implements HttpInterceptor {
  constructor(private encryptionService: EncryptionService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Skip encryption for assets, external URLs (like Google), or if explicitly skipped
    if (
      request.url.includes('assets/') ||
      !request.url.startsWith(environment.apiUrl)
    ) {
      return next.handle(request);
    }

    let clonedRequest = request;

    // Encrypt Request Body
    if (request.body && !(request.body instanceof FormData)) {
      const encryptedBody = {
        data: this.encryptionService.encrypt(request.body),
      };
      clonedRequest = request.clone({
        body: encryptedBody,
      });
    }

    return next.handle(clonedRequest).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // Decrypt Response Body
          // Check if body has 'data' property which is the encrypted string
          // Or if the whole body is the string. Usually APIs return JSON { data: "..." }
          if (
            event.body &&
            event.body.data &&
            typeof event.body.data === 'string'
          ) {
            // Try to decrypt
            const decrypted = this.encryptionService.decrypt(event.body.data);
            if (decrypted) {
              return event.clone({ body: decrypted });
            }
          }
        }
        return event;
      })
    );
  }
}
