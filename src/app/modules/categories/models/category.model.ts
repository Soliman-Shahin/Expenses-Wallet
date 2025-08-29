export interface Category {
  _id?: string;
  title?: string;
  icon?: string;
  color?: string;
  type?: 'income' | 'outcome';
  order?: number;
}
