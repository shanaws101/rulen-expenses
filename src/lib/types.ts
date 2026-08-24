export type Role = 'admin' | 'manager' | 'employee';

export type Currency = 'USD' | 'BDT';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  team_id?: string;
  manager_id?: string | null;
  avatar_url?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  submitted_by: string;
  amount: number;
  currency: Currency;
  exchange_rate: number; // BDT per USD at time of entry
  category_id: string;
  description: string;
  expense_date: string; // YYYY-MM-DD
  receipt_url?: string | null;
  status: ExpenseStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  period: 'month' | 'year';
  month_year: string; // e.g. "2026-08" or "2026"
  limit_amount: number;
  limit_currency: Currency;
  created_by?: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  expense_id?: string | null;
  actor_id: string;
  action: 'created' | 'approved' | 'rejected' | 'resubmitted' | 'updated_budget' | 'updated_settings' | 'created_category' | 'created_user';
  details?: Record<string, any>;
  created_at: string;
}

export interface AppSettings {
  default_exchange_rate: number; // BDT per USD
  company_name: string;
  base_currency: 'BDT';
}

export interface ExpenseWithDetails extends Expense {
  submitter?: Profile;
  category?: Category;
  reviewer?: Profile;
  converted_amount_bdt: number;
}
