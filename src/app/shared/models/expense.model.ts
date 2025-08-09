import { Category } from './category.model';

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: Category | string; // Can be a populated object or just an ID
  date: Date;
  user: string; // User ID
  createdAt?: Date;
  updatedAt?: Date;
}
