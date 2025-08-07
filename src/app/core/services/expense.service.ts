import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Expense } from 'src/app/shared/models/expense.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly endpoint = '/expenses';

  constructor(private apiService: ApiService) {}

  getExpenses(): Observable<Expense[]> {
    return this.apiService.get<Expense[]>(this.endpoint);
  }

  getExpense(id: string): Observable<Expense> {
    return this.apiService.get<Expense>(`${this.endpoint}/${id}`);
  }

  createExpense(expense: Partial<Expense>): Observable<Expense> {
    return this.apiService.post<Expense>(`${this.endpoint}`, expense);
  }

  updateExpense(id: string, expense: Partial<Expense>): Observable<Expense> {
    return this.apiService.put<Expense>(`${this.endpoint}/${id}`, expense);
  }

  deleteExpense(id: string): Observable<any> {
    return this.apiService.delete(`${this.endpoint}/${id}`);
  }

  getTotals(
    startDate: Date,
    endDate: Date
  ): Observable<{ income: number; expenses: number }> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.apiService.get<{ income: number; expenses: number }>(
      `${this.endpoint}/totals`,
      params
    );
  }
}
