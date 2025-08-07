import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category } from 'src/app/shared/models';
import { ApiService } from 'src/app/core/services';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiService = inject(ApiService);

  getCategories(params: {
    skip: number;
    limit: number;
    sort: string;
  }): Observable<Category[]> {
    const httpParams = new HttpParams()
      .set('skip', params.skip.toString())
      .set('limit', params.limit.toString())
      .set('sort', params.sort);

    return this.apiService
      .get<{ data?: Category[]; items?: Category[] }>(
        '/categories/list',
        httpParams
      )
      .pipe(
        map(
          (
            response: { data?: Category[]; items?: Category[] } | Category[]
          ) => {
            // Ensure we're returning an array
            if (Array.isArray(response)) {
              return response;
            }
            console.warn('Unexpected categories response format:', response);
            return [];
          }
        )
      );
  }

  getCategory(id: string): Observable<Category> {
    return this.apiService.get<Category>(`/categories/${id}`);
  }

  createCategory(categoryData: Partial<Category>): Observable<Category> {
    return this.apiService.post<Category>('/categories/create', categoryData);
  }

  updateCategory(id: string, categoryData: Partial<Category>): Observable<Category> {
    return this.apiService.put<Category>(`/categories/${id}`, categoryData);
  }

  deleteCategory(id: string): Observable<void> {
    return this.apiService.delete<void>(`/categories/${id}`);
  }
}
