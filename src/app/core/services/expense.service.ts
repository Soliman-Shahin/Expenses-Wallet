import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Expense } from 'src/app/shared/models/expense.model';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

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

  constructor(private apiService: ApiService, private auth: AuthService) {
    // Clear caches when auth user changes (login/logout) to avoid stale/unauthenticated results
    this.auth.userChanges.subscribe(() => {
      this.expensesCache$ = null;
      this.totalsCache.clear();
    });
  }

  getExpenses(forceRefresh = false): Observable<Expense[]> {
    if (!this.expensesCache$ || forceRefresh) {
      this.expensesCache$ = this.apiService
        .get<Expense[]>(this.endpoint)
        .pipe(
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
      tap(() => {
        this.expensesCache$ = null;
        this.totalsCache.clear();
      })
    );
  }

  updateExpense(id: string, expense: Partial<Expense>): Observable<Expense> {
    return this.apiService.put<Expense>(`${this.endpoint}/${id}`, expense).pipe(
      tap(() => {
        this.expensesCache$ = null;
        this.totalsCache.clear();
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
        // Do not cache error emissions
        shareReplay({ bufferSize: 1, refCount: true })
      );
    this.totalsCache.set(key, req$);
    return req$;
  }
}
