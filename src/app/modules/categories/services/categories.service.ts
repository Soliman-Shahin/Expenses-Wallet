import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category } from 'src/app/shared/models';
import { CategoryParams } from '../models';
import { ApiService } from 'src/app/core/services';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiService = inject(ApiService);

  getCategories(params: CategoryParams, forceRefresh = false): Observable<{ data: Category[]; total: number }> {
    let httpParams = new HttpParams()
      .set('skip', params.skip.toString())
      .set('limit', params.limit.toString())
      .set('sort', params.sort);

    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }

    // Add cache-busting parameter if forceRefresh is true
    if (forceRefresh) {
      httpParams = httpParams.set('_t', Date.now().toString());
    }

    return this.apiService.get<{ data: Category[]; total: number }>(
      '/categories/list',
      httpParams
    );
  }

  getCategory(id: string): Observable<Category> {
    return this.apiService.get<Category>(`/categories/${id}`);
  }

  createCategory(categoryData: Partial<Category>): Observable<Category> {
    return this.apiService.post<Category>('/categories/create', categoryData);
  }

  updateCategory(
    id: string,
    categoryData: Partial<Category>
  ): Observable<Category> {
    return this.apiService.put<Category>(
      `/categories/update/${id}`,
      categoryData
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.apiService.delete<void>(`/categories/delete/${id}`);
  }

  updateOrder(categories: { categoryId: string; order: number }[]): Observable<void> {
    return this.apiService.put<void>('/categories/update-order', {
      categories,
    });
  }
}
