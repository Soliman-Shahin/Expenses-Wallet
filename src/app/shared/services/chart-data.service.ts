import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

interface ChartData {
  name: string;
  value: number;
}

interface ExpenseData {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChartDataService {
  
  // Generate mock expense data by category for pie chart
  getExpenseByCategory(): Observable<ChartData[]> {
    const mockData: ChartData[] = [
      { name: 'Food', value: 350 },
      { name: 'Transport', value: 200 },
      { name: 'Entertainment', value: 150 },
      { name: 'Utilities', value: 180 },
      { name: 'Shopping', value: 220 },
      { name: 'Healthcare', value: 90 }
    ];
    return of(mockData);
  }
  
  // Generate mock monthly expense data for line chart
  getMonthlyExpenses(): Observable<ChartData[]> {
    const mockData: ChartData[] = [
      { name: 'Jan', value: 1200 },
      { name: 'Feb', value: 1100 },
      { name: 'Mar', value: 1400 },
      { name: 'Apr', value: 1300 },
      { name: 'May', value: 1600 },
      { name: 'Jun', value: 1500 }
    ];
    return of(mockData);
  }
  
  // Generate mock income vs expense data for bar chart
  getIncomeVsExpense(): Observable<ChartData[]> {
    const mockData: ChartData[] = [
      { name: 'Income', value: 5000 },
      { name: 'Expenses', value: 1400 }
    ];
    return of(mockData);
  }
  
  // Generate mock salary breakdown for pie chart
  getSalaryBreakdown(): Observable<ChartData[]> {
    const mockData: ChartData[] = [
      { name: 'Basic Salary', value: 4500 },
      { name: 'Bonus', value: 500 }
    ];
    return of(mockData);
  }
}
