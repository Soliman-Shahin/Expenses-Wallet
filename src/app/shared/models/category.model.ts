export interface Category {
  _id: string;
  title: string;
  type: 'income' | 'outcome';
  user: string; // User ID
  icon?: string;
  color?: string;
}
