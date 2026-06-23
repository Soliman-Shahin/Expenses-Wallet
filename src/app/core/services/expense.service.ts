import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, shareReplay, tap, switchMap, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Expense } from 'src/app/shared/models/expense.model';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { OfflineStorageService } from './offline-storage.service';
import { ConnectionService } from './connection.service';
import { SyncStatus } from 'src/app/shared/models/sync.model';

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

  private apiService = inject(ApiService);
  private auth = inject(AuthService);
  private offlineStorage = inject(OfflineStorageService);
  private connectionService = inject(ConnectionService);

  constructor() {
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
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== null &&
          params[key] !== undefined &&
          params[key] !== ''
        ) {
          httpParams = httpParams.set(key, params[key]);
        }
      });

      // Add cache-busting parameter if forceRefresh is true
      if (forceRefresh) {
        httpParams = httpParams.set('_t', Date.now().toString());
      }

      return this.apiService.get<Expense[]>(this.endpoint, httpParams).pipe(
        switchMap((expenses) => {
          return this.offlineStorage.getEntities<any>('expense').pipe(
            map((localExpenses) => {
              const pendingLocal = localExpenses.filter(e => e._syncStatus === SyncStatus.PENDING);
              const pendingActive = pendingLocal.filter(e => !e._isDeleted);
              const pendingDeletes = new Set(pendingLocal.filter(e => e._isDeleted).map(e => e._id));
              
              const apiIds = new Set(expenses.map(e => e._id));
              let uniquePending = pendingActive.filter(e => !apiIds.has(e._id));
              
              // Basic rudimentary filtering for pending items so they somewhat match the query
              if (params.startDate && params.endDate) {
                const start = new Date(params.startDate).getTime();
                const end = new Date(params.endDate).getTime();
                uniquePending = uniquePending.filter(e => {
                  const d = new Date(e.date).getTime();
                  return d >= start && d <= end;
                });
              }
              if (params.category) {
                uniquePending = uniquePending.filter(e => {
                   const catId = typeof e.category === 'object' ? e.category._id : e.category;
                   return catId === params.category;
                });
              }

              const filteredApi = expenses.filter(e => !pendingDeletes.has(e._id));
              const merged = [...uniquePending, ...filteredApi] as Expense[];
              merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              return { apiExpenses: expenses, mergedExpenses: merged };
            })
          );
        }),
        tap(({ apiExpenses }) => {
          if (apiExpenses && apiExpenses.length > 0) {
            this.offlineStorage
              .replaceEntities('expense', apiExpenses as any[])
              .subscribe();
          }
        }),
        map(({ mergedExpenses }) => mergedExpenses),
        catchError(() => {
          // 🔌 Offline fallback: return local data when API call fails
          console.warn(
            '⚠️ [ExpenseService] API failed for filtered expenses, falling back to offline storage'
          );
          return this.offlineStorage
            .getEntities<any>('expense')
            .pipe(map((localExpenses) => localExpenses as Expense[]));
        })
      );
    }

    // Use cache for regular requests without filters
    if (!this.expensesCache$ || forceRefresh) {
      this.expensesCache$ = this.apiService.get<Expense[]>(this.endpoint).pipe(
        switchMap((expenses) => {
          return this.offlineStorage.getEntities<any>('expense').pipe(
            map((localExpenses) => {
              const pendingLocal = localExpenses.filter(e => e._syncStatus === SyncStatus.PENDING);
              
              // Find pending creates/updates
              const pendingActive = pendingLocal.filter(e => !e._isDeleted);
              // Find pending deletes
              const pendingDeletes = new Set(pendingLocal.filter(e => e._isDeleted).map(e => e._id));
              
              // Filter out API items that were deleted locally but not yet synced
              const apiIds = new Set(expenses.map(e => e._id));
              const uniquePending = pendingActive.filter(e => !apiIds.has(e._id));
              const filteredApi = expenses.filter(e => !pendingDeletes.has(e._id));
              
              const merged = [...uniquePending, ...filteredApi] as Expense[];
              // Sort by date descending
              merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              return { apiExpenses: expenses, mergedExpenses: merged };
            })
          );
        }),
        tap(({ apiExpenses }) => {
          // Save to offline storage for backup
          if (apiExpenses && apiExpenses.length > 0) {
            this.offlineStorage
              .replaceEntities('expense', apiExpenses as any[])
              .subscribe();
          }
        }),
        map(({ mergedExpenses }) => mergedExpenses),
        catchError(() => {
          // 🔌 Offline fallback: return local IndexedDB data
          console.warn(
            '⚠️ [ExpenseService] API failed, falling back to offline storage'
          );
          this.expensesCache$ = null; // clear cache so next online call refetches
          return this.offlineStorage
            .getEntities<any>('expense')
            .pipe(map((localExpenses) => localExpenses as Expense[]));
        }),
        // Do not cache error emissions
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.expensesCache$;
  }

  getExpense(id: string): Observable<Expense> {
    return this.apiService.get<Expense>(`${this.endpoint}/${id}`).pipe(
      catchError(() => {
        // 🔌 Try to get from local storage
        return this.offlineStorage.getEntity<any>('expense', id).pipe(
          switchMap((local) => {
            if (local) return of(local as Expense);
            return throwError(() => new Error('Expense not found offline'));
          })
        );
      })
    );
  }

  createExpense(expense: Partial<Expense>): Observable<Expense> {
    const isOnline = this.connectionService.isOnline();

    if (!isOnline) {
      // 🔌 Offline: Save locally with PENDING status
      return this._saveOffline('CREATE', expense);
    }

    return this.apiService.post<Expense>(`${this.endpoint}`, expense).pipe(
      tap((createdExpense) => {
        this.expensesCache$ = null;
        this.totalsCache.clear();
        // Mirror to offline storage (marked as SYNCED)
        this.offlineStorage
          .saveEntity('expense', {
            ...createdExpense,
            _syncStatus: SyncStatus.SYNCED,
          } as any)
          .subscribe();
      }),
      catchError(() => {
        // 🔌 API failed while trying (might have gone offline mid-request)
        console.warn(
          '⚠️ [ExpenseService] createExpense API failed, saving offline'
        );
        return this._saveOffline('CREATE', expense);
      })
    );
  }

  updateExpense(id: string, expense: Partial<Expense>): Observable<Expense> {
    const isOnline = this.connectionService.isOnline();

    if (!isOnline) {
      // 🔌 Offline: update locally with PENDING status
      return this._saveOffline('UPDATE', { ...expense, _id: id });
    }

    return this.apiService.put<Expense>(`${this.endpoint}/${id}`, expense).pipe(
      tap((updatedExpense) => {
        this.expensesCache$ = null;
        this.totalsCache.clear();
        this.offlineStorage
          .saveEntity('expense', {
            ...updatedExpense,
            _syncStatus: SyncStatus.SYNCED,
          } as any)
          .subscribe();
      }),
      catchError(() => {
        console.warn(
          '⚠️ [ExpenseService] updateExpense API failed, saving offline'
        );
        return this._saveOffline('UPDATE', { ...expense, _id: id });
      })
    );
  }

  deleteExpense(id: string): Observable<any> {
    const isOnline = this.connectionService.isOnline();

    if (!isOnline) {
      // 🔌 Offline: soft delete locally
      return this.offlineStorage.deleteEntity('expense', id).pipe(
        tap(() => {
          this.expensesCache$ = null;
          this.totalsCache.clear();
        }),
        map(() => ({ success: true, offline: true }))
      );
    }

    return this.apiService.delete(`${this.endpoint}/${id}`).pipe(
      tap(() => {
        this.expensesCache$ = null;
        this.totalsCache.clear();
        // Also mark as deleted in local storage
        this.offlineStorage.deleteEntity('expense', id).subscribe();
      }),
      catchError(() => {
        console.warn(
          '⚠️ [ExpenseService] deleteExpense API failed, deleting offline'
        );
        return this.offlineStorage.deleteEntity('expense', id).pipe(
          tap(() => {
            this.expensesCache$ = null;
            this.totalsCache.clear();
          }),
          map(() => ({ success: true, offline: true }))
        );
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
        catchError(() => {
          // 🔌 Offline fallback: compute totals from IndexedDB
          return this._computeOfflineTotals(startDate, endDate);
        }),
        // Do not cache error emissions
        shareReplay({ bufferSize: 1, refCount: true })
      );
    this.totalsCache.set(key, req$);
    return req$;
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Saves an expense offline as a PENDING entity for later sync.
   */
  private _saveOffline(
    type: 'CREATE' | 'UPDATE',
    expense: Partial<Expense>
  ): Observable<Expense> {
    const offlineEntity: any = {
      ...expense,
      _id: expense['_id' as keyof Expense] || this._generateOfflineId(),
      _syncStatus: SyncStatus.PENDING,
      _lastModified: new Date(),
      _version: 1,
      _isDeleted: false,
    };

    return this.offlineStorage.saveEntity('expense', offlineEntity).pipe(
      tap(() => {
        this.expensesCache$ = null;
        this.totalsCache.clear();
        console.log(
          `📴 [ExpenseService] Saved offline (${type}):`,
          offlineEntity._id
        );
      }),
      map((saved) => saved as unknown as Expense)
    );
  }

  /**
   * Computes income/expense totals from local IndexedDB for the given date range.
   */
  private _computeOfflineTotals(
    startDate: Date,
    endDate: Date
  ): Observable<{ income: number; expenses: number }> {
    return this.offlineStorage.getEntities<any>('expense').pipe(
      map((expenses) => {
        const filtered = expenses.filter((e: any) => {
          const d = new Date(e.date);
          return d >= startDate && d <= endDate && !e._isDeleted;
        });

        return filtered.reduce(
          (acc: { income: number; expenses: number }, e: any) => {
            const amount = Number(e.amount) || 0;
            // category can be a string ID or populated object
            const catType =
              typeof e.category === 'object' ? e.category?.type : undefined;

            if (catType === 'income') {
              acc.income += amount;
            } else {
              acc.expenses += amount;
            }
            return acc;
          },
          { income: 0, expenses: 0 }
        );
      })
    );
  }

  /**
   * Generates a temporary local ID for offline-created entities.
   * Will be replaced by the server's real _id after sync.
   */
  private _generateOfflineId(): string {
    return `offline_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
  }
}
