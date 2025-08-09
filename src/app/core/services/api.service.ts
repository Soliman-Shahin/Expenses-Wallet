import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService, TokenService } from 'src/app/modules/auth/services';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private authService: AuthService | null = null;

  constructor(
    private http: HttpClient,
    private storageService: TokenService,
    private injector: Injector
  ) {}

  private getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    return this.authService;
  }

  private getHeadersObject(): { [key: string]: string } {
    let token = '';
    const tokenObj = this.storageService.getAccessToken();

    if (typeof tokenObj === 'string') {
      token = tokenObj;
    } else if (tokenObj) {
      token = String(tokenObj);
    }

    token = token.replace(/^"|"$/g, '');

    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No valid access token found in storage');
    }

    try {
      const userId = this.storageService.getUserId();
      if (userId) {
        headers['_id'] = userId;
      } else {
        console.warn('No user ID available for request headers');
      }
    } catch (error) {
      console.warn('Could not get user ID for request headers', error);
    }

    if (!environment.production) {
      console.log('Request headers:', headers);
    }

    return headers;
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders(this.getHeadersObject());
  }

  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${path}`, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(catchError(this.handleError));
  }

  post<T>(
    path: string,
    body: any,
    options: { headers?: HttpHeaders; params?: HttpParams } = {}
  ): Observable<T> {
    const defaultHeaders = this.getHeadersObject();

    let extraHeaders: { [key: string]: string } = {};
    if (options.headers) {
      options.headers.keys().forEach((key) => {
        const val = options.headers!.get(key);
        if (val) extraHeaders[key] = val;
      });
    }

    const mergedHeaders = new HttpHeaders({
      ...defaultHeaders,
      ...extraHeaders,
    });

    return this.http
      .post<T>(`${this.baseUrl}${path}`, body, {
        headers: mergedHeaders,
        params: options.params,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Post multipart/form-data without forcing Content-Type so the browser can set the boundary.
   */
  postFormData<T>(
    path: string,
    formData: FormData,
    options: { headers?: HttpHeaders; params?: HttpParams } = {}
  ): Observable<T> {
    const defaultHeaders = this.getHeadersObject();
    // Remove Content-Type to allow the browser to set it for multipart
    delete (defaultHeaders as any)['Content-Type'];

    let extraHeaders: { [key: string]: string } = {};
    if (options.headers) {
      options.headers.keys().forEach((key) => {
        const val = options.headers!.get(key);
        if (val) extraHeaders[key] = val;
      });
    }

    const mergedHeaders = new HttpHeaders({
      ...defaultHeaders,
      ...extraHeaders,
    });

    return this.http
      .post<T>(`${this.baseUrl}${path}`, formData, {
        headers: mergedHeaders,
        params: options.params,
      })
      .pipe(catchError(this.handleError));
  }

  put<T>(
    path: string,
    body: any,
    options: { params?: HttpParams } = {}
  ): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${path}`, body, {
        headers: this.getHeaders(),
        params: options.params,
      })
      .pipe(catchError(this.handleError));
  }

  delete<T>(
    path: string,
    options: { params?: HttpParams } = {}
  ): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${path}`, {
        headers: this.getHeaders(),
        params: options.params,
      })
      .pipe(catchError(this.handleError));
  }

  patch<T>(
    path: string,
    body: any,
    options: { params?: HttpParams } = {}
  ): Observable<T> {
    return this.http
      .patch<T>(`${this.baseUrl}${path}`, body, {
        headers: this.getHeaders(),
        params: options.params,
      })
      .pipe(catchError(this.handleError));
  }

  // Centralized error handler
  private handleError(error: any) {
    let message = 'Unknown error occurred';
    if (error.error && error.error.message) {
      message = error.error.message;
    } else if (error.message) {
      message = error.message;
    }
    // Optionally log or display error here
    return throwError(() => new Error(message));
  }
}
