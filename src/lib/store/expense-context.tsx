'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Profile,
  Category,
  Expense,
  Budget,
  ActivityLog,
  AppSettings,
  Role,
  Currency,
  ExpenseWithDetails,
  Account,
  JournalEntry,
  JournalLine,
  CapitalContribution,
  RecurringItem,
  AccountingBasis,
  JournalSourceType,
  ContributionMethod,
  PaymentStatus,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
} from './initial-data';
import {
  INITIAL_ACCOUNTS,
  generateCapitalContributionJournalEntry,
  generateExpenseApprovalJournalEntry,
  generateExpenseSettlementJournalEntry,
  verifyJournalBalance,
} from '../accounting';
import { convertToBDT } from '../currency';
import { createClient } from '../supabase/client';

export interface TeamInvitation {
  id: string;
  email: string;
  name: string;
  role: Role;
  team_id?: string;
  manager_id?: string | null;
  status: 'pending' | 'accepted';
  created_at: string;
}

interface ExpenseContextType {
  // Auth & Profiles
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  profiles: Profile[];
  invitations: TeamInvitation[];
  isLoading: boolean;
  
  // Real Supabase Auth Methods
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, name: string, role?: Role) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  
  // Settings & Basis
  settings: AppSettings;
  updateExchangeRate: (newRate: number) => Promise<void>;
  accountingBasis: AccountingBasis;
  setAccountingBasis: (basis: AccountingBasis) => void;
  
  // Categories
  categories: Category[];
  addCategory: (name: string, description?: string) => Promise<void>;
  toggleCategoryActive: (categoryId: string) => Promise<void>;
  
  // Expenses & Payables
  allExpenses: Expense[];
  scopedExpenses: ExpenseWithDetails[];
  pendingApprovals: ExpenseWithDetails[];
  unpaidPayables: ExpenseWithDetails[];
  
  // Expense Actions
  addExpense: (data: {
    amount: number;
    currency: Currency;
    exchange_rate?: number;
    category_id: string;
    description: string;
    expense_date: string;
    receipt_url?: string | null;
    payment_status?: PaymentStatus;
    due_date?: string | null;
    paid_date?: string | null;
  }) => Promise<Expense>;
  updateExpense: (
    id: string,
    data: Partial<Omit<Expense, 'id' | 'created_at'>>
  ) => Promise<void>;
  resubmitExpense: (
    id: string,
    data: {
      amount: number;
      currency: Currency;
      exchange_rate?: number;
      category_id: string;
      description: string;
      expense_date: string;
      receipt_url?: string | null;
      payment_status?: PaymentStatus;
      due_date?: string | null;
    }
  ) => Promise<void>;
  approveExpense: (id: string, reviewNote?: string) => Promise<void>;
  rejectExpense: (id: string, reviewNote: string) => Promise<void>;
  markExpenseAsPaid: (expenseId: string, paidDate?: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Chart of Accounts & General Ledger
  accounts: Account[];
  addAccount: (data: {
    code?: string;
    name: string;
    type: Account['type'];
    parent_id?: string | null;
    description?: string;
  }) => Promise<Account>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: {
    entry_date: string;
    settled_date?: string | null;
    description: string;
    source_type?: JournalSourceType;
    source_id?: string | null;
    lines: {
      account_id: string;
      debit_amount: number;
      credit_amount: number;
      currency: Currency;
      exchange_rate?: number;
      debit_bdt?: number;
      credit_bdt?: number;
    }[];
  }) => Promise<JournalEntry>;
  
  // Capital Contributions
  capitalContributions: CapitalContribution[];
  addCapitalContribution: (data: {
    amount: number;
    currency: Currency;
    exchange_rate?: number;
    contribution_date: string;
    settled_date?: string;
    method: ContributionMethod;
    note?: string;
    founder_account_id?: string;
    contributed_by: string;
  }) => Promise<CapitalContribution>;
  
  // Recurring Items & Subscriptions
  recurringItems: RecurringItem[];
  addRecurringItem: (item: Omit<RecurringItem, 'id' | 'created_at'>) => Promise<RecurringItem>;
  updateRecurringItem: (id: string, item: Partial<RecurringItem>) => Promise<void>;
  deleteRecurringItem: (id: string) => Promise<void>;
  
  // Budgets
  budgets: Budget[];
  saveBudget: (data: {
    id?: string;
    category_id: string;
    period: 'month' | 'year';
    month_year: string;
    limit_amount: number;
    limit_currency: Currency;
  }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  // Users & Team Management
  inviteMember: (userData: {
    name: string;
    email: string;
    role: Role;
    team_id?: string;
    manager_id?: string | null;
  }) => Promise<{ invitation?: TeamInvitation; error?: string }>;
  updateUser: (
    id: string,
    data: Partial<Omit<Profile, 'id' | 'created_at'>>
  ) => Promise<void>;
  
  // Activity Logs
  activityLogs: ActivityLog[];
  refreshData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [capitalContributions, setCapitalContributions] = useState<CapitalContribution[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [accountingBasis, setAccountingBasis] = useState<AccountingBasis>('accrual');
  const [isLoading, setIsLoading] = useState(true);

  // Helper to ensure current user profile exists in database
  const ensureUserProfile = useCallback(async (user: any): Promise<Profile> => {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existing) {
        return existing as Profile;
      }

      const res = await fetch('/api/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: user.user_metadata?.role || 'admin',
          team_id: user.user_metadata?.team_id || 'Executive',
        }),
      });

      const json = await res.json();
      if (json?.profile) {
        return json.profile as Profile;
      }

      return {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: (user.user_metadata?.role as Role) || 'admin',
        team_id: 'Executive',
        created_at: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('ensureUserProfile notice:', e);
      return {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: 'admin',
        team_id: 'Executive',
        created_at: new Date().toISOString(),
      };
    }
  }, [supabase]);

  // Helper to resolve real Category UUID from database
  const resolveCategoryUUID = useCallback(async (categoryIdOrName: string): Promise<string> => {
    if (UUID_REGEX.test(categoryIdOrName)) {
      return categoryIdOrName;
    }

    const found = categories.find(
      (c) => c.id === categoryIdOrName || c.name.toLowerCase() === categoryIdOrName.toLowerCase()
    );
    if (found && UUID_REGEX.test(found.id)) {
      return found.id;
    }

    const catName = found?.name || categoryIdOrName.replace(/^cat-/, '').replace(/-/g, ' ');

    const { data: dbCat } = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', catName)
      .limit(1)
      .maybeSingle();

    if (dbCat?.id && UUID_REGEX.test(dbCat.id)) {
      return dbCat.id;
    }

    const { data: newCat } = await supabase
      .from('categories')
      .insert({
        name: catName,
        description: 'Auto-created operational category',
        is_active: true,
      })
      .select('id')
      .single();

    if (newCat?.id) {
      return newCat.id;
    }

    return categoryIdOrName;
  }, [categories, supabase]);

  // 1. Fetch All Real Data from Supabase & Accounting API
  const refreshData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await ensureUserProfile(session.user);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }

      // Fetch Categories
      let { data: catList } = await supabase.from('categories').select('*').order('name');
      if (!catList || catList.length === 0) {
        const seedPayload = INITIAL_CATEGORIES.map((c) => ({
          name: c.name,
          description: c.description,
          is_active: true,
        }));
        await supabase.from('categories').insert(seedPayload);
        const { data: freshCats } = await supabase.from('categories').select('*').order('name');
        catList = freshCats;
      }
      if (catList && catList.length > 0) {
        setCategories(catList as Category[]);
      }

      // Fetch Profiles
      const { data: profilesList } = await supabase.from('profiles').select('*').order('name');
      if (profilesList) {
        setProfiles(profilesList as Profile[]);
      }

      // Fetch Team Invitations
      const { data: invList } = await supabase.from('team_invitations').select('*').order('created_at', { ascending: false });
      if (invList) {
        setInvitations(invList as TeamInvitation[]);
      }

      // Fetch Budgets
      const { data: budgetList } = await supabase.from('budgets').select('*');
      if (budgetList) {
        setBudgets(budgetList as Budget[]);
      }

      // Fetch Expenses
      const { data: expList } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (expList) {
        setExpenses(
          expList.map((e) => ({
            ...e,
            payment_status: e.payment_status || 'paid',
          })) as Expense[]
        );
      }

      // Fetch Accounting Data (Accounts, Journal Entries, Contributions, Recurring Items)
      try {
        const accRes = await fetch('/api/accounting');
        const accData = await accRes.json();
        if (accData.accounts && accData.accounts.length > 0) {
          setAccounts(accData.accounts);
        }
        if (accData.journalEntries) {
          setJournalEntries(accData.journalEntries);
        }
        if (accData.contributions) {
          setCapitalContributions(accData.contributions);
        }
        if (accData.recurringItems) {
          setRecurringItems(accData.recurringItems);
        }
      } catch (accErr) {
        console.warn('Accounting API fetch fallback:', accErr);
      }

      // Fetch Settings
      const { data: settingsList } = await supabase.from('settings').select('*');
      if (settingsList) {
        const rateRow = settingsList.find((s) => s.key === 'default_exchange_rate');
        if (rateRow?.value?.bdt_per_usd) {
          setSettings((prev) => ({
            ...prev,
            default_exchange_rate: Number(rateRow.value.bdt_per_usd),
          }));
        }
      }

      // Fetch Activity Logs
      const { data: logList } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (logList) {
        setActivityLogs(logList as ActivityLog[]);
      }
    } catch (err) {
      console.warn('refreshData notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, ensureUserProfile]);

  useEffect(() => {
    refreshData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          const profile = await ensureUserProfile(session.user);
          setCurrentUser(profile);
        }
        await refreshData();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setExpenses([]);
        setBudgets([]);
        setJournalEntries([]);
        setCapitalContributions([]);
        setRecurringItems([]);
        setActivityLogs([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, refreshData, ensureUserProfile]);

  // Auth Methods
  const signInWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      await ensureUserProfile(data.user);
      await refreshData();
    }
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, name: string, role: Role = 'admin') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          team_id: role === 'admin' ? 'Executive' : role === 'accountant' ? 'Finance' : 'Engineering',
        },
      },
    });

    if (!error && data.user) {
      await ensureUserProfile(data.user);
      await refreshData();
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // Helper to log audit activity
  const logActivity = async (
    actorId: string,
    action: ActivityLog['action'],
    expenseId?: string | null,
    details?: Record<string, any>
  ) => {
    try {
      const newLog = {
        expense_id: expenseId || null,
        actor_id: actorId,
        action,
        details: details || {},
      };
      const { data } = await supabase.from('activity_logs').insert(newLog).select().single();
      if (data) {
        setActivityLogs((prev) => [data as ActivityLog, ...prev]);
      }
    } catch (e) {
      console.warn('Activity log write error:', e);
    }
  };

  // 1. UPDATE EXCHANGE RATE
  const updateExchangeRate = async (newRate: number) => {
    setSettings((prev) => ({
      ...prev,
      default_exchange_rate: Number(newRate),
    }));

    try {
      await supabase.from('settings').upsert({
        key: 'default_exchange_rate',
        value: { bdt_per_usd: Number(newRate), updated_at: new Date().toISOString() },
        updated_by: currentUser?.id,
      });

      if (currentUser) {
        logActivity(currentUser.id, 'updated_settings', null, {
          field: 'default_exchange_rate',
          value: newRate,
        });
      }
    } catch (e) {
      console.warn('Failed to update rate in Supabase:', e);
    }
  };

  // 2. CATEGORIES
  const addCategory = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: name.trim(),
          description: description?.trim() || '',
          is_active: true,
          created_by: currentUser?.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCategories((prev) => [...prev, data as Category]);
      }
      if (currentUser) {
        logActivity(currentUser.id, 'created_category', null, { categoryName: name });
      }
    } catch (e: any) {
      console.error('Failed to add category:', e);
      throw new Error(e.message || 'Failed to add category.');
    }
  };

  const toggleCategoryActive = async (categoryId: string) => {
    const target = categories.find((c) => c.id === categoryId);
    if (!target) return;
    const nextState = !target.is_active;

    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, is_active: nextState } : c))
    );

    try {
      await supabase.from('categories').update({ is_active: nextState }).eq('id', categoryId);
    } catch (e) {
      console.warn('Failed to toggle category:', e);
    }
  };

  // 3. EXPENSES CRUD & PAYABLES
  const addExpense = async (data: {
    amount: number;
    currency: Currency;
    exchange_rate?: number;
    category_id: string;
    description: string;
    expense_date: string;
    receipt_url?: string | null;
    payment_status?: PaymentStatus;
    due_date?: string | null;
    paid_date?: string | null;
  }): Promise<Expense> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('You must be signed in to submit an expense.');
    }

    const rate = data.exchange_rate && data.exchange_rate > 0 
      ? data.exchange_rate 
      : settings.default_exchange_rate;

    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        amount: data.amount,
        currency: data.currency,
        exchange_rate: rate,
        category_id: data.category_id,
        description: data.description,
        expense_date: data.expense_date,
        receipt_url: data.receipt_url,
        payment_status: data.payment_status || 'paid',
        due_date: data.due_date || null,
        paid_date: data.paid_date || (data.payment_status === 'paid' ? data.expense_date : null),
      }),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error || 'Failed to submit expense entry.');
    }

    const newExpense = json.expense as Expense;
    setExpenses((prev) => [newExpense, ...prev]);
    await refreshData();
    return newExpense;
  };

  const updateExpense = async (
    id: string,
    data: Partial<Omit<Expense, 'id' | 'created_at'>>
  ) => {
    const { error } = await supabase.from('expenses').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    await refreshData();
  };

  const resubmitExpense = async (
    id: string,
    data: {
      amount: number;
      currency: Currency;
      exchange_rate?: number;
      category_id: string;
      description: string;
      expense_date: string;
      receipt_url?: string | null;
      payment_status?: PaymentStatus;
      due_date?: string | null;
    }
  ) => {
    const validCategoryId = await resolveCategoryUUID(data.category_id);
    const rate = data.exchange_rate && data.exchange_rate > 0 
      ? data.exchange_rate 
      : settings.default_exchange_rate;

    const payload = {
      amount: Number(data.amount),
      currency: data.currency,
      exchange_rate: rate,
      category_id: validCategoryId,
      description: data.description.trim(),
      expense_date: data.expense_date,
      receipt_url: data.receipt_url || null,
      payment_status: data.payment_status || 'paid',
      due_date: data.due_date || null,
      status: 'pending' as const,
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('expenses').update(payload).eq('id', id);
    if (error) throw new Error(error.message);

    if (currentUser) {
      logActivity(currentUser.id, 'resubmitted', id, {
        amount: data.amount,
        currency: data.currency,
      });
    }

    await refreshData();
  };

  const approveExpense = async (id: string, reviewNote?: string) => {
    if (!currentUser) return;
    const targetExp = expenses.find((e) => e.id === id);
    if (!targetExp) return;

    const payload = {
      status: 'approved' as const,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote?.trim() || 'Approved',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('expenses').update(payload).eq('id', id);
    if (error) throw new Error(error.message);

    // Auto-generate balanced double-entry journal entry
    try {
      const { entry, lines } = generateExpenseApprovalJournalEntry(
        { ...targetExp, ...payload },
        categories,
        accounts,
        currentUser.id
      );
      await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_journal_entry',
          ...entry,
          lines,
        }),
      });
    } catch (jErr) {
      console.warn('Auto journal generation notice on approval:', jErr);
    }

    logActivity(currentUser.id, 'approved', id, { note: reviewNote });
    await refreshData();
  };

  const rejectExpense = async (id: string, reviewNote: string) => {
    if (!currentUser) return;
    const payload = {
      status: 'rejected' as const,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('expenses').update(payload).eq('id', id);
    if (error) throw new Error(error.message);

    logActivity(currentUser.id, 'rejected', id, { note: reviewNote });
    await refreshData();
  };

  const markExpenseAsPaid = async (expenseId: string, paidDate?: string) => {
    if (!currentUser) return;
    const effectivePaidDate = paidDate || new Date().toISOString().substring(0, 10);

    const res = await fetch('/api/accounting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mark_expense_paid',
        expenseId,
        paidDate: effectivePaidDate,
        actorId: currentUser.id,
      }),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error || 'Failed to mark expense as paid.');
    }

    logActivity(currentUser.id, 'marked_paid', expenseId, { paidDate: effectivePaidDate });
    await refreshData();
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await refreshData();
  };

  // 4. CHART OF ACCOUNTS & GENERAL LEDGER
  const addAccount = async (data: {
    code?: string;
    name: string;
    type: Account['type'];
    parent_id?: string | null;
    description?: string;
  }): Promise<Account> => {
    const res = await fetch('/api/accounting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_account',
        ...data,
      }),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error || 'Failed to create account.');
    }

    const created = json.account as Account;
    setAccounts((prev) => [...prev, created]);
    if (currentUser) {
      logActivity(currentUser.id, 'created_account', null, { accountName: data.name, type: data.type });
    }
    await refreshData();
    return created;
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    const { error } = await supabase.from('accounts').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    await refreshData();
  };

  const addJournalEntry = async (entry: {
    entry_date: string;
    settled_date?: string | null;
    description: string;
    source_type?: JournalSourceType;
    source_id?: string | null;
    lines: {
      account_id: string;
      debit_amount: number;
      credit_amount: number;
      currency: Currency;
      exchange_rate?: number;
      debit_bdt?: number;
      credit_bdt?: number;
    }[];
  }): Promise<JournalEntry> => {
    if (!currentUser) throw new Error('You must be signed in to post journal entries.');

    // Calculate BDT amounts
    const rate = settings.default_exchange_rate || 122.5;
    const computedLines = entry.lines.map((line) => {
      const lineRate = line.exchange_rate || rate;
      const debitBDT = line.debit_bdt ?? (line.currency === 'USD' ? line.debit_amount * lineRate : line.debit_amount);
      const creditBDT = line.credit_bdt ?? (line.currency === 'USD' ? line.credit_amount * lineRate : line.credit_amount);
      return {
        ...line,
        exchange_rate: lineRate,
        debit_bdt: debitBDT,
        credit_bdt: creditBDT,
      };
    });

    // Enforce double-entry balance check
    const balance = verifyJournalBalance(computedLines);
    if (!balance.isBalanced) {
      throw new Error(
        `Journal entry does not balance! Total Debits: ${balance.totalDebits.toFixed(2)} BDT, Total Credits: ${balance.totalCredits.toFixed(2)} BDT (Difference: ${balance.diff.toFixed(2)} BDT). Every entry must balance to zero.`
      );
    }

    const res = await fetch('/api/accounting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_journal_entry',
        entry_date: entry.entry_date,
        settled_date: entry.settled_date || null,
        description: entry.description,
        created_by: currentUser.id,
        source_type: entry.source_type || 'manual',
        source_id: entry.source_id || null,
        lines: computedLines,
      }),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error || 'Failed to save journal entry.');
    }

    const createdEntry = json.entry as JournalEntry;
    setJournalEntries((prev) => [createdEntry, ...prev]);
    logActivity(currentUser.id, 'posted_journal_entry', null, { description: entry.description });
    await refreshData();
    return createdEntry;
  };

  // 5. CAPITAL CONTRIBUTIONS
  const addCapitalContribution = async (data: {
    amount: number;
    currency: Currency;
    exchange_rate?: number;
    contribution_date: string;
    settled_date?: string;
    method: ContributionMethod;
    note?: string;
    founder_account_id?: string;
    contributed_by: string;
  }): Promise<CapitalContribution> => {
    if (!currentUser) throw new Error('You must be signed in.');

    const res = await fetch('/api/accounting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_contribution',
        ...data,
      }),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error || 'Failed to record capital contribution.');
    }

    const created = json.contribution as CapitalContribution;
    setCapitalContributions((prev) => [created, ...prev]);
    logActivity(currentUser.id, 'recorded_contribution', null, {
      amount: data.amount,
      currency: data.currency,
      contributed_by: data.contributed_by,
    });
    await refreshData();
    return created;
  };

  // 6. RECURRING ITEMS
  const addRecurringItem = async (item: Omit<RecurringItem, 'id' | 'created_at'>): Promise<RecurringItem> => {
    const res = await fetch('/api/accounting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_recurring',
        ...item,
      }),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error || 'Failed to create recurring item.');
    }

    const created = json.recurringItem as RecurringItem;
    setRecurringItems((prev) => [...prev, created]);
    if (currentUser) {
      logActivity(currentUser.id, 'created_recurring', null, { name: item.name });
    }
    await refreshData();
    return created;
  };

  const updateRecurringItem = async (id: string, item: Partial<RecurringItem>) => {
    const { error } = await supabase.from('recurring_items').update(item).eq('id', id);
    if (error) throw new Error(error.message);
    await refreshData();
  };

  const deleteRecurringItem = async (id: string) => {
    const { error } = await supabase.from('recurring_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await refreshData();
  };

  // 7. BUDGETS
  const saveBudget = async (data: {
    id?: string;
    category_id: string;
    period: 'month' | 'year';
    month_year: string;
    limit_amount: number;
    limit_currency: Currency;
  }) => {
    const validCategoryId = await resolveCategoryUUID(data.category_id);

    const payload = {
      category_id: validCategoryId,
      period: data.period,
      month_year: data.month_year,
      limit_amount: Number(data.limit_amount),
      limit_currency: data.limit_currency,
      created_by: currentUser?.id,
    };

    if (data.id) {
      const { error } = await supabase.from('budgets').update(payload).eq('id', data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('budgets').insert(payload);
      if (error) throw new Error(error.message);
    }
    await refreshData();
  };

  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await refreshData();
  };

  // 8. INVITE TEAM MEMBERS
  const inviteMember = async (userData: {
    name: string;
    email: string;
    role: Role;
    team_id?: string;
    manager_id?: string | null;
  }): Promise<{ invitation?: TeamInvitation; error?: string }> => {
    try {
      const payload = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        role: userData.role,
        team_id: userData.team_id || (userData.role === 'admin' ? 'Executive' : userData.role === 'accountant' ? 'Finance' : 'Engineering'),
        manager_id: userData.manager_id || null,
        invited_by: currentUser?.id || null,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('team_invitations')
        .upsert(payload, { onConflict: 'email' })
        .select()
        .single();

      if (error) {
        console.warn('team_invitations notice:', error);
      }

      await refreshData();
      return { invitation: (data as TeamInvitation) || { ...payload, id: `inv-${Date.now()}`, created_at: new Date().toISOString() } };
    } catch (e: any) {
      return { error: e.message || 'Failed to send invite' };
    }
  };

  const updateUser = async (id: string, data: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('profiles').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    await refreshData();
  };

  // 9. SCOPE EXPENSES BY USER ROLE
  const scopedExpenses = useMemo<ExpenseWithDetails[]>(() => {
    if (!currentUser) return [];
    let filtered = expenses;

    if (currentUser.role === 'employee') {
      filtered = expenses.filter((e) => e.submitted_by === currentUser.id);
    } else if (currentUser.role === 'manager') {
      const managedIds = profiles
        .filter((p) => p.manager_id === currentUser.id || p.id === currentUser.id)
        .map((p) => p.id);
      filtered = expenses.filter((e) => managedIds.includes(e.submitted_by));
    }
    // Admin & Accountant have full visibility into all expenses

    return filtered.map((e) => {
      const submitter = profiles.find((p) => p.id === e.submitted_by) || (e.submitted_by === currentUser.id ? currentUser : undefined);
      const category = categories.find((c) => c.id === e.category_id);
      const reviewer = e.reviewed_by ? profiles.find((p) => p.id === e.reviewed_by) : undefined;
      const converted_amount_bdt = convertToBDT(e.amount, e.currency, e.exchange_rate);

      return {
        ...e,
        submitter,
        category,
        reviewer,
        converted_amount_bdt,
      };
    });
  }, [expenses, currentUser, profiles, categories]);

  const pendingApprovals = useMemo<ExpenseWithDetails[]>(() => {
    // Accountant cannot approve operational expenses unless they are also Admin
    if (!currentUser || currentUser.role === 'employee' || currentUser.role === 'accountant') {
      return [];
    }
    return scopedExpenses.filter((e) => e.status === 'pending');
  }, [scopedExpenses, currentUser]);

  const unpaidPayables = useMemo<ExpenseWithDetails[]>(() => {
    if (!currentUser) return [];
    return scopedExpenses.filter(
      (e) => e.status === 'approved' && e.payment_status === 'unpaid'
    );
  }, [scopedExpenses, currentUser]);

  const value = {
    currentUser,
    setCurrentUser,
    profiles,
    invitations,
    isLoading,
    signInWithPassword,
    signUpWithEmail,
    signOut,
    settings,
    updateExchangeRate,
    accountingBasis,
    setAccountingBasis,
    categories,
    addCategory,
    toggleCategoryActive,
    allExpenses: expenses,
    scopedExpenses,
    pendingApprovals,
    unpaidPayables,
    addExpense,
    updateExpense,
    resubmitExpense,
    approveExpense,
    rejectExpense,
    markExpenseAsPaid,
    deleteExpense,
    accounts,
    addAccount,
    updateAccount,
    journalEntries,
    addJournalEntry,
    capitalContributions,
    addCapitalContribution,
    recurringItems,
    addRecurringItem,
    updateRecurringItem,
    deleteRecurringItem,
    budgets,
    saveBudget,
    deleteBudget,
    inviteMember,
    updateUser,
    activityLogs,
    refreshData,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
