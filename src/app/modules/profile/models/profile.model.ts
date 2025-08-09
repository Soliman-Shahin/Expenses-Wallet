import { SalaryDetail } from 'src/app/home/models/salary.model';

export interface UserProfile {
  username: string;
  email: string;
  phone?: string;
  salary: SalaryDetail[];
  currency: string;
  avatarUrl?: string;
}
