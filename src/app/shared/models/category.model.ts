export interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  user: string; // User ID
}
