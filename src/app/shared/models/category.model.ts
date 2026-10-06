export interface Category {
  _id: string;
  title: string;
  type: 'income' | 'outcome';
  order?: number;
  user: string; // User ID
  icon?: string;
  color?: string;
}
