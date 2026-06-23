import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Category } from 'src/app/shared/models';
import { CategoryParams } from '../models';
import { ApiService } from 'src/app/core/services';
import { OfflineStorageService } from 'src/app/core/services/offline-storage.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiService = inject(ApiService);
  private offlineStorage = inject(OfflineStorageService);

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

    if (forceRefresh) {
      httpParams = httpParams.set('_t', Date.now().toString());
    }

    return this.apiService.get<{ data: Category[]; total: number }>(
      '/categories/list',
      httpParams
    ).pipe(
      tap(response => {
        if (response?.data && response.data.length > 0) {
          this.offlineStorage.replaceEntities('category', response.data as any[]).subscribe();
        }
      }),
      catchError(() => {
        console.warn('⚠️ [CategoryService] API failed, loading from offline storage');
        return this.offlineStorage.getEntities<any>('category').pipe(
          map(categories => {
            let filtered = categories;
            if (params.type) {
              filtered = filtered.filter(c => c.type === params.type);
            }
            if (params.q) {
              const q = params.q.toLowerCase();
              filtered = filtered.filter(c => c.name?.en?.toLowerCase().includes(q) || c.name?.ar?.includes(q));
            }
            return { data: filtered, total: filtered.length };
          })
        );
      })
    );
  }

  getCategory(id: string): Observable<Category> {
    return this.apiService.get<Category>(`/categories/${id}`).pipe(
      catchError(() => {
        return this.offlineStorage.getEntity<any>('category', id).pipe(
          map(category => {
            if (!category) throw new Error('Category not found offline');
            return category;
          })
        );
      })
    );
  }

  createCategory(categoryData: Partial<Category>): Observable<Category> {
    return this.apiService.post<Category>('/categories/create', categoryData).pipe(
      tap(category => {
        this.offlineStorage.saveEntity('category', category as any).subscribe();
      }),
      catchError(() => {
        console.warn('⚠️ [CategoryService] API failed, saving offline');
        return this._saveOffline('CREATE', categoryData);
      })
    );
  }

  updateCategory(id: string, categoryData: Partial<Category>): Observable<Category> {
    return this.apiService.put<Category>(`/categories/update/${id}`, categoryData).pipe(
      tap(category => {
        this.offlineStorage.saveEntity('category', category as any).subscribe();
      }),
      catchError(() => {
        console.warn('⚠️ [CategoryService] API failed, updating offline');
        return this._saveOffline('UPDATE', { ...categoryData, _id: id } as Partial<Category>);
      })
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.apiService.delete<void>(`/categories/delete/${id}`).pipe(
      catchError(() => {
        console.warn('⚠️ [CategoryService] API failed, marking as deleted offline');
        return this.offlineStorage.deleteEntity('category', id).pipe(
          map(() => void 0)
        );
      })
    );
  }

  updateOrder(categories: { categoryId: string; order: number }[]): Observable<void> {
    return this.apiService.put<void>('/categories/update-order', {
      categories,
    });
  }

  private _saveOffline(type: 'CREATE' | 'UPDATE', category: Partial<Category>): Observable<Category> {
    const offlineEntity: any = {
      ...category,
      _id: category['_id' as keyof Category] || this._generateOfflineId(),
      _syncStatus: 'PENDING',
      _isDeleted: false,
      _lastModified: new Date()
    };
    return this.offlineStorage.saveEntity('category', offlineEntity).pipe(
      map(saved => saved as unknown as Category)
    );
  }

  private _generateOfflineId(): string {
    return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
