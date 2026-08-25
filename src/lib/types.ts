export type Role = 'admin' | 'manager' | 'employee' | 'accountant';

export type Currency = 'USD' | 'BDT';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export type PaymentStatus = 'paid' | 'unpaid';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export type AccountingBasis = 'accrual' | 'cash';

export type JournalSourceType = 'expense' | 'contribution' | 'adjustment' | 'manual';

export type ContributionMethod = 'bank_transfer' | 'cash' | 'other';

export type RecurringFrequency = 'monthly' | 'quarterly' | 'annual';

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
  expense_date: string; // YYYY-MM-DD (entry_date)
  receipt_url?: string | null;
  status: ExpenseStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  payment_status: PaymentStatus;
  due_date?: string | null;
  paid_date?: string | null; // settled_date
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

export interface Account {
  id: string;
  code?: string;
  name: string;
  type: AccountType;
  parent_id?: string | null;
  is_active: boolean;
  description?: string;
  created_at: string;
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit_amount: number; // in original currency
  credit_amount: number; // in original currency
  currency: Currency;
  exchange_rate: number;
  debit_bdt: number;
  credit_bdt: number;
  account?: Account;
}

export interface JournalEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD (accrual)
  settled_date?: string | null; // YYYY-MM-DD (cash)
  description: string;
  created_by: string;
  source_type: JournalSourceType;
  source_id?: string | null;
  lines: JournalLine[];
  creator?: Profile;
  created_at: string;
}

export interface CapitalContribution {
  id: string;
  contributed_by: string; // Profile ID
  founder_account_id?: string | null; // Account ID for founder capital
  amount: number;
  currency: Currency;
  exchange_rate: number;
  contribution_date: string; // entry_date
  settled_date?: string | null;
  method: ContributionMethod;
  note?: string | null;
  contributor?: Profile;
  account?: Account;
  journal_entry_id?: string | null;
  created_at: string;
}

export interface RecurringItem {
  id: string;
  name: string;
  category_id: string;
  vendor_name: string;
  amount: number;
  currency: Currency;
  exchange_rate?: number;
  frequency: RecurringFrequency;
  next_due_date: string; // YYYY-MM-DD
  is_active: boolean;
  category?: Category;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  expense_id?: string | null;
  actor_id: string;
  action:
    | 'created'
    | 'approved'
    | 'rejected'
    | 'resubmitted'
    | 'updated_budget'
    | 'updated_settings'
    | 'created_category'
    | 'created_user'
    | 'posted_journal_entry'
    | 'recorded_contribution'
    | 'marked_paid'
    | 'created_recurring'
    | 'created_account';
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

export interface TrialBalanceRow {
  account: Account;
  debitTotal: number;
  creditTotal: number;
  netDebit: number;
  netCredit: number;
}

export interface BalanceSheetData {
  asOfDate: string;
  basis: AccountingBasis;
  assets: {
    accounts: { account: Account; balance: number }[];
    total: number;
  };
  liabilities: {
    accounts: { account: Account; balance: number }[];
    total: number;
  };
  equity: {
    accounts: { account: Account; balance: number }[];
    retainedEarnings: number;
    total: number;
  };
  isBalanced: boolean;
  netDifference: number;
}

export interface CashBurnMetrics {
  currentCashBalanceBDT: number;
  unpaidPayablesBDT: number;
  netLiquidCashBDT: number;
  trailing3MonthsBurnBDT: number;
  averageMonthlyBurnBDT: number;
  runwayMonths: number;
  monthlyHistory: {
    month: string;
    contributionsBDT: number;
    cashExpensesBDT: number;
    netBurnBDT: number;
  }[];
}

export interface ForecastProjection {
  periodMonths: 3 | 6 | 12;
  currentCashBDT: number;
  recurringMonthlyBDT: number;
  historicalNonRecurringMonthlyBDT: number;
  projectedMonthlySpendBDT: number;
  projectedTotalSpendBDT: number;
  projectedEndingCashBDT: number;
  projectedRunwayMonths: number;
  monthsList: {
    month: string;
    startingCashBDT: number;
    recurringSpendBDT: number;
    variableSpendBDT: number;
    totalSpendBDT: number;
    endingCashBDT: number;
  }[];
}
