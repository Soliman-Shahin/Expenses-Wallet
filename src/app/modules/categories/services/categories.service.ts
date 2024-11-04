import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from '../../auth/services';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  constructor() {}

  // get all categories
  getCategories(params?: any): Observable<any> {
    return this.http
      .get(`${environment.apiUrl}/categories/list`, {
        params: params,
        headers: new HttpHeaders({
          'refresh-token': this.tokenService.getRefreshToken() || '',
          _id: this.tokenService.getUserId() || '',
        }),
        observe: 'response',
      })
      .pipe(
        map((response) => {
          return response.body;
        }),
        catchError((error) => {
          return error;
        })
      );
  }

  // cerate new category
  createCategory(data: any): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/categories/create`, data, {
        headers: new HttpHeaders({
          'refresh-token': this.tokenService.getRefreshToken() || '',
          _id: this.tokenService.getUserId() || '',
        }),
        observe: 'response',
      })
      .pipe(
        map((response) => {
          return response.body;
        }),
        catchError((error) => {
          return error;
        })
      );
  }
}
