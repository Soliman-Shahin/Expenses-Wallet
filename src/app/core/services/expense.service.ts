import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Expense } from 'src/app/shared/models/expense.model';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { OfflineStorageService } from './offline-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly endpoint = '/expenses';
  // Cache the expenses list to prevent duplicate network calls across widgets
  private expensesCache$: Observable<Expense[]> | null = null;
  // Cache for totals requests keyed by date range
  private totalsCache = new Map<
    string,
    Observable<{ income: number; expenses: number }>
  >();

  constructor(
    private apiService: ApiService,
    private auth: AuthService,
    private offlineStorage: OfflineStorageService
  ) {
    // Clear caches when auth user changes (login/logout) to avoid stale/unauthenticated results
    this.auth.userChanges.subscribe(() => {
      this.expensesCache$ = null;
      this.totalsCache.clear();
    });
  }

  getExpenses(params?: any, forceRefresh = false): Observable<Expense[]> {
    // If we have params (filters), don't use cache
    if (params && Object.keys(params).length > 0) {
      let httpParams = new HttpParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
      
      // Add cache-busting parameter if forceRefresh is true
      if (forceRefresh) {
        httpParams = httpParams.set('_t', Date.now().toString());
      }
      
      return this.apiService.get<Expense[]>(this.endpoint, httpParams);
    }

    // Use cache for regular requests without filters
    if (!this.expensesCache$ || forceRefresh) {
      this.expensesCache$ = this.apiService
        .get<Expense[]>(this.endpoint)
        .pipe(
          tap(expenses => {
            // Save to offline storage for backup
            if (expenses && expenses.length > 0) {
              this.offlineStorage.setEntities('expense', expenses as any[]);
            }
          }),
          catchError((error: unknown) => {
            this.expensesCache$ = null;
            return throwError(() => error);
          }),
          // Do not cache error emissions
          shareReplay({ bufferSize: 1, refCount: true })
        );
    }
    return this.expensesCache$;
  }

  getExpense(id: string): Observable<Expense> {
    return this.apiService.get<Expense>(`${this.endpoint}/${id}`);
  }

  createExpense(expense: Partial<Expense>): Observable<Expense> {
    return this.apiService.post<Expense>(`${this.endpoint}`, expense).pipe(
      tap(createdExpense => {
        this.expensesCache$ = null;
        this.totalsCache.clear();
        // Save to offline storage
        this.offlineStorage.saveEntity('expense', createdExpense as any).subscribe();
      })
    );
  }

  updateExpense(id: string, expense: Partial<Expense>): Observable<Expense> {
    return this.apiService.put<Expense>(`${this.endpoint}/${id}`, expense).pipe(
      tap(updatedExpense => {
        this.expensesCache$ = null;
        this.totalsCache.clear();
        // Update in offline storage
        this.offlineStorage.saveEntity('expense', updatedExpense as any).subscribe();
      })
    );
  }

  deleteExpense(id: string): Observable<any> {
    return this.apiService.delete(`${this.endpoint}/${id}`).pipe(
      tap(() => {
        this.expensesCache$ = null;
        this.totalsCache.clear();
      })
    );
  }

  getTotals(
    startDate: Date,
    endDate: Date
  ): Observable<{ income: number; expenses: number }> {
    const key = `${startDate.toISOString()}|${endDate.toISOString()}`;
    const existing = this.totalsCache.get(key);
    if (existing) return existing;

    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    const req$ = this.apiService
      .get<{ income: number; expenses: number }>(
        `${this.endpoint}/totals`,
        params
      )
      .pipe(
        catchError((error: unknown) => {
          this.totalsCache.delete(key);
          return throwError(() => error);
        }),
        // Do not cache error emissions
        shareReplay({ bufferSize: 1, refCount: true })
      );
    this.totalsCache.set(key, req$);
    return req$;
  }
}
