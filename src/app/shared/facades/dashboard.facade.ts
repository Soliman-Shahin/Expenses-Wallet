import { Injectable, inject } from '@angular/core';
import {
  Observable,
  map,
  shareReplay,
  forkJoin,
  of,
  switchMap,
  catchError,
} from 'rxjs';
import { ChartDataService } from '../services/chart-data.service';
import { ProfileService } from 'src/app/modules/profile/services/profile.service';
import { NamedValue } from 'src/app/shared/models';
import { ExpenseService } from 'src/app/core/services/expense.service';
import { CategoryService } from 'src/app/modules/categories/services/categories.service';
import { Category, Expense } from 'src/app/shared/models';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly charts = inject(ChartDataService);
  private readonly profile = inject(ProfileService);
  private readonly expenses = inject(ExpenseService);
  private readonly categories = inject(CategoryService);

  // Chart streams
  readonly incomeVsExpense$: Observable<NamedValue[]> =
    this.charts.getIncomeVsExpense();
  readonly expenseByCategory$: Observable<NamedValue[]> =
    this.charts.getExpenseByCategory();
  readonly monthlyExpenses$: Observable<NamedValue[]> =
    this.charts.getMonthlyExpenses();
  readonly salaryBreakdown$: Observable<NamedValue[]> =
    this.charts.getSalaryBreakdown();

  // Profile stream (currency, salary, etc.)
  readonly profile$ = this.profile.profile$;

  // Derived totals from income vs expense stream
  readonly totals$ = this.incomeVsExpense$.pipe(
    map((pairs) => {
      const income =
        pairs.find((p) => p.name.toLowerCase() === 'income')?.value ?? 0;
      const expenses =
        pairs.find((p) => p.name.toLowerCase() === 'expenses')?.value ?? 0;
      const balance = income - expenses;
      return { income, expenses, balance } as const;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  // API-backed totals helpers
  totalsForRange(
    startDate: Date,
    endDate: Date
  ): Observable<{ income: number; expenses: number; balance: number }> {
    const normalize = (val: any) => {
      const income = Number((val || {}).income ?? 0);
      const expenses = Number((val || {}).expenses ?? 0);
      return {
        income: isFinite(income) ? income : 0,
        expenses: isFinite(expenses) ? expenses : 0,
      };
    };
    return this.expenses.getTotals(startDate, endDate).pipe(
      map((res) => {
        const { income, expenses } = normalize(res);
        return { income, expenses, balance: income - expenses };
      }),
      // If API fails, compute locally
      catchError(() => this.computeTotalsFromExpenses(startDate, endDate)),
      // If API returns zeros, try to compute locally (covers backends without totals endpoint)
      switchMap((res) =>
        res && (res.income !== 0 || res.expenses !== 0)
          ? of(res)
          : this.computeTotalsFromExpenses(startDate, endDate)
      )
    );
  }

  totalsForMonth(
    month: number,
    year: number
  ): Observable<{ income: number; expenses: number; balance: number }> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return this.totalsForRange(startDate, endDate);
  }

  // Compute expense distribution by category for a given month from real data
  expenseByCategoryForMonth(
    month: number,
    year: number
  ): Observable<NamedValue[]> {
    const startInclusive = new Date(year, month - 1, 1).getTime();
    const endExclusive = new Date(year, month, 1).getTime();
    return forkJoin({
      categoriesResp: this.categories.getCategories({
        skip: 0,
        limit: 1000,
        sort: 'name',
      }),
      expenses: this.expenses.getExpenses(),
    }).pipe(
      map(({ categoriesResp, expenses }) => {
        const categoriesWrapped = categoriesResp as
          | { data?: Category[] | { data?: Category[] }; total?: number }
          | Category[];
        const categories: Category[] = Array.isArray(categoriesWrapped)
          ? categoriesWrapped
          : (categoriesWrapped?.data as any)?.data ??
            (categoriesWrapped?.data as Category[]) ??
            [];
        const byId = new Map<string, { name: string; type?: string }>();
        categories.forEach((c) =>
          byId.set(c._id, {
            name: (c as any).title || c.name,
            type: (c as any).type,
          })
        );

        const expArr: Expense[] = Array.isArray(expenses)
          ? (expenses as Expense[])
          : (expenses as any)?.data?.data || (expenses as any)?.data || [];
        const sums = new Map<string, number>();

        expArr
          .filter((e) => {
            const rawDate = e?.date || e?.createdAt;
            if (!rawDate) return false;
            const t = new Date(rawDate).getTime();
            return t >= startInclusive && t < endExclusive;
          })
          .forEach((e) => {
            // Only aggregate expense (non-income) categories
            let name = 'Uncategorized';
            let catType: string | undefined;
            if (e.category && typeof e.category === 'object') {
              name =
                (e.category as any).title || (e.category as any).name || name;
              catType = (e.category as any).type;
            } else if (typeof e.category === 'string') {
              const meta = byId.get(e.category);
              if (meta) {
                name = meta.name;
                catType = meta.type;
              }
            }
            const typeLower = (catType ?? '').toString().toLowerCase();
            if (typeLower === 'income') return; // skip income lines

            const amt = Number(e.amount);
            if (!Number.isFinite(amt) || Number.isNaN(amt)) return;
            sums.set(name, (sums.get(name) || 0) + amt);
          });

        return Array.from(sums.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      })
    );
  }

  // Compute daily expense totals for a given month
  monthlyExpensesForMonth(
    month: number,
    year: number
  ): Observable<NamedValue[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const startInclusive = new Date(year, month - 1, 1).getTime();
    const endExclusive = new Date(year, month, 1).getTime();
    return this.expenses.getExpenses().pipe(
      map((resp) => {
        const expArr: Expense[] = Array.isArray(resp)
          ? (resp as Expense[])
          : (resp as any)?.data?.data || (resp as any)?.data || [];
        const daily = new Array<number>(daysInMonth).fill(0);
        expArr
          .filter((e) => {
            const rawDate = e?.date || e?.createdAt;
            if (!rawDate) return false;
            const t = new Date(rawDate).getTime();
            return t >= startInclusive && t < endExclusive;
          })
          .forEach((e) => {
            // exclude income from daily expenses
            const cat = e.category;
            let type: string | undefined = undefined;
            if (cat && typeof cat === 'object') type = (cat as any).type;
            // If string id, we can't resolve type here cheaply; count as expense by default
            const typeLower = (type ?? '').toString().toLowerCase();
            if (typeLower === 'income') return;
            const amt = Number(e.amount);
            if (!Number.isFinite(amt) || Number.isNaN(amt)) return;
            const d = new Date(
              (e as any)?.date || (e as any)?.createdAt
            ).getDate();
            const idx = d - 1;
            if (idx >= 0 && idx < daysInMonth) daily[idx] += amt;
          });
        return daily.map((v, i) => ({ name: String(i + 1), value: v }));
      }),
      switchMap((arr) =>
        arr && arr.length > 0 ? of(arr) : this.charts.getMonthlyExpenses()
      )
    );
  }

  // Helper: compute totals by scanning expenses when API totals are unavailable
  private computeTotalsFromExpenses(
    startDate: Date,
    endDate: Date
  ): Observable<{ income: number; expenses: number; balance: number }> {
    const startInclusive = startDate.getTime();
    const endInclusive = endDate.getTime();
    return this.expenses.getExpenses().pipe(
      map((resp) => {
        const expArr: Expense[] = Array.isArray(resp)
          ? (resp as Expense[])
          : (resp as any)?.data?.data || (resp as any)?.data || [];
        let income = 0;
        let expenses = 0;
        for (const e of expArr) {
          const rawDate = (e as any)?.date || (e as any)?.createdAt;
          if (!rawDate) continue;
          const t = new Date(rawDate).getTime();
          if (t < startInclusive || t > endInclusive) continue;
          let type: string | undefined;
          const cat = e.category as any;
          if (cat && typeof cat === 'object') type = cat.type;
          const typeLower = (type ?? '').toString().toLowerCase();
          const amt = Number(e.amount);
          if (!Number.isFinite(amt) || Number.isNaN(amt)) continue;
          if (typeLower === 'income') income += amt;
          else expenses += amt;
        }
        return { income, expenses, balance: income - expenses };
      })
    );
  }
}
