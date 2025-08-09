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
  }): Observable<{ data: Category[]; total: number }> {
    const httpParams = new HttpParams()
      .set('skip', params.skip.toString())
      .set('limit', params.limit.toString())
      .set('sort', params.sort);

    return this.apiService
      .get<{ success: boolean; data: { data: Category[]; total: number }; message: string }>(
        '/categories/list',
        httpParams
      )
      .pipe(
        map((response) => {
          if (response && response.data && Array.isArray(response.data.data)) {
            return { data: response.data.data, total: response.data.total };
          }
          console.warn('Unexpected categories response format:', response);
          return { data: [], total: 0 };
        })
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
