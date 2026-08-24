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
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
} from './initial-data';
import { convertToBDT } from '../currency';
import { createClient } from '../supabase/client';

interface ExpenseContextType {
  // Auth & Profiles
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  profiles: Profile[];
  isLoading: boolean;
  
  // Real Supabase Auth Methods
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, name: string, role?: Role) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  
  // Settings & Currency
  settings: AppSettings;
  updateExchangeRate: (newRate: number) => Promise<void>;
  
  // Categories
  categories: Category[];
  addCategory: (name: string, description?: string) => Promise<void>;
  toggleCategoryActive: (categoryId: string) => Promise<void>;
  
  // Expenses & Scoping
  allExpenses: Expense[];
  scopedExpenses: ExpenseWithDetails[];
  pendingApprovals: ExpenseWithDetails[];
  
  // Expense Actions
  addExpense: (data: {
    amount: number;
    currency: Currency;
    exchange_rate?: number;
    category_id: string;
    description: string;
    expense_date: string;
    receipt_url?: string | null;
  }) => Promise<Expense | null>;
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
    }
  ) => Promise<void>;
  approveExpense: (id: string, reviewNote?: string) => Promise<void>;
  rejectExpense: (id: string, reviewNote: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
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
  addUser: (userData: {
    name: string;
    email: string;
    role: Role;
    team_id?: string;
    manager_id?: string | null;
  }) => Promise<void>;
  updateUser: (
    id: string,
    data: Partial<Omit<Profile, 'id' | 'created_at'>>
  ) => Promise<void>;
  
  // Activity Logs
  activityLogs: ActivityLog[];
  refreshData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch All Real Data from Supabase
  const refreshData = useCallback(async () => {
    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch or create current user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setCurrentUser(profileData as Profile);
        } else {
          // Fallback profile if trigger is delayed
          const fallbackProfile: Profile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: (session.user.user_metadata?.role as Role) || 'admin',
            team_id: session.user.user_metadata?.team_id || 'Engineering',
            created_at: session.user.created_at || new Date().toISOString(),
          };
          setCurrentUser(fallbackProfile);
          // Try inserting profile
          await supabase.from('profiles').upsert(fallbackProfile);
        }
      } else {
        setCurrentUser(null);
      }

      // Fetch profiles
      const { data: profilesList } = await supabase.from('profiles').select('*').order('name');
      if (profilesList && profilesList.length > 0) {
        setProfiles(profilesList as Profile[]);
      }

      // Fetch categories
      const { data: catList } = await supabase.from('categories').select('*').order('name');
      if (catList && catList.length > 0) {
        setCategories(catList as Category[]);
      }

      // Fetch budgets
      const { data: budgetList } = await supabase.from('budgets').select('*');
      if (budgetList) {
        setBudgets(budgetList as Budget[]);
      }

      // Fetch expenses
      const { data: expList } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (expList) {
        setExpenses(expList as Expense[]);
      }

      // Fetch settings
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

      // Fetch activity logs
      const { data: logList } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (logList) {
        setActivityLogs(logList as ActivityLog[]);
      }
    } catch (err) {
      console.warn('Supabase fetch notice (running in active mode):', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Listen to Auth State Changes
  useEffect(() => {
    refreshData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        refreshData();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setExpenses([]);
        setBudgets([]);
        setActivityLogs([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, refreshData]);

  // Auth Methods
  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      await refreshData();
    }
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, name: string, role: Role = 'admin') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          team_id: 'Engineering',
        },
      },
    });
    if (!error) {
      await refreshData();
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // Helper to log audit activity in Supabase
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

      if (data) {
        setCategories((prev) => [...prev, data as Category]);
      }
      if (currentUser) {
        logActivity(currentUser.id, 'created_category', null, { categoryName: name });
      }
    } catch (e) {
      console.warn('Failed to add category:', e);
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
      await supabase
        .from('categories')
        .update({ is_active: nextState })
        .eq('id', categoryId);
    } catch (e) {
      console.warn('Failed to toggle category:', e);
    }
  };

  // 3. EXPENSES CRUD
  const addExpense = async (data: {
    amount: number;
    currency: Currency;
    exchange_rate?: number;
    category_id: string;
    description: string;
    expense_date: string;
    receipt_url?: string | null;
  }): Promise<Expense | null> => {
    if (!currentUser) return null;

    const isAdmin = currentUser.role === 'admin';
    const rate = data.exchange_rate && data.exchange_rate > 0 
      ? data.exchange_rate 
      : settings.default_exchange_rate;

    const payload = {
      submitted_by: currentUser.id,
      amount: Number(data.amount),
      currency: data.currency,
      exchange_rate: rate,
      category_id: data.category_id,
      description: data.description.trim(),
      expense_date: data.expense_date,
      receipt_url: data.receipt_url || null,
      status: isAdmin ? 'approved' : 'pending',
      reviewed_by: isAdmin ? currentUser.id : null,
      reviewed_at: isAdmin ? new Date().toISOString() : null,
      review_note: isAdmin ? 'Auto-approved (Founder / Admin submission)' : null,
    };

    try {
      const { data: newRow, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select()
        .single();

      if (newRow) {
        setExpenses((prev) => [newRow as Expense, ...prev]);
        logActivity(currentUser.id, 'created', newRow.id, {
          amount: newRow.amount,
          currency: newRow.currency,
          description: newRow.description,
          autoApproved: isAdmin,
        });
        return newRow as Expense;
      }
    } catch (e) {
      console.warn('Expense insert fallback:', e);
    }

    return null;
  };

  const updateExpense = async (
    id: string,
    data: Partial<Omit<Expense, 'id' | 'created_at'>>
  ) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...data, updated_at: new Date().toISOString() } : exp))
    );

    try {
      await supabase.from('expenses').update(data).eq('id', id);
    } catch (e) {
      console.warn('Expense update failed:', e);
    }
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
    }
  ) => {
    const rate = data.exchange_rate && data.exchange_rate > 0 
      ? data.exchange_rate 
      : settings.default_exchange_rate;

    const payload = {
      amount: Number(data.amount),
      currency: data.currency,
      exchange_rate: rate,
      category_id: data.category_id,
      description: data.description.trim(),
      expense_date: data.expense_date,
      receipt_url: data.receipt_url || null,
      status: 'pending' as const,
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    };

    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...payload } : exp))
    );

    try {
      await supabase.from('expenses').update(payload).eq('id', id);
      if (currentUser) {
        logActivity(currentUser.id, 'resubmitted', id, {
          amount: data.amount,
          currency: data.currency,
        });
      }
    } catch (e) {
      console.warn('Failed to resubmit expense:', e);
    }
  };

  const approveExpense = async (id: string, reviewNote?: string) => {
    if (!currentUser) return;
    const payload = {
      status: 'approved' as const,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote?.trim() || 'Approved',
      updated_at: new Date().toISOString(),
    };

    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...payload } : exp))
    );

    try {
      await supabase.from('expenses').update(payload).eq('id', id);
      logActivity(currentUser.id, 'approved', id, { note: reviewNote });
    } catch (e) {
      console.warn('Failed to approve expense:', e);
    }
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

    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...payload } : exp))
    );

    try {
      await supabase.from('expenses').update(payload).eq('id', id);
      logActivity(currentUser.id, 'rejected', id, { note: reviewNote });
    } catch (e) {
      console.warn('Failed to reject expense:', e);
    }
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch (e) {
      console.warn('Failed to delete expense:', e);
    }
  };

  // 4. BUDGETS
  const saveBudget = async (data: {
    id?: string;
    category_id: string;
    period: 'month' | 'year';
    month_year: string;
    limit_amount: number;
    limit_currency: Currency;
  }) => {
    const payload = {
      category_id: data.category_id,
      period: data.period,
      month_year: data.month_year,
      limit_amount: Number(data.limit_amount),
      limit_currency: data.limit_currency,
      created_by: currentUser?.id,
    };

    try {
      if (data.id) {
        await supabase.from('budgets').update(payload).eq('id', data.id);
      } else {
        const { data: newBudget } = await supabase
          .from('budgets')
          .insert(payload)
          .select()
          .single();
        if (newBudget) {
          setBudgets((prev) => [...prev, newBudget as Budget]);
        }
      }
      await refreshData();
    } catch (e) {
      console.warn('Failed to save budget:', e);
    }
  };

  const deleteBudget = async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    try {
      await supabase.from('budgets').delete().eq('id', id);
    } catch (e) {
      console.warn('Failed to delete budget:', e);
    }
  };

  // 5. USER MANAGEMENT
  const addUser = async (userData: {
    name: string;
    email: string;
    role: Role;
    team_id?: string;
    manager_id?: string | null;
  }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: `user-${Date.now()}`,
          name: userData.name.trim(),
          email: userData.email.trim(),
          role: userData.role,
          team_id: userData.team_id || 'Engineering',
          manager_id: userData.manager_id || null,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
        })
        .select()
        .single();

      if (data) {
        setProfiles((prev) => [...prev, data as Profile]);
      }
      await refreshData();
    } catch (e) {
      console.warn('Failed to add profile:', e);
    }
  };

  const updateUser = async (id: string, data: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    try {
      await supabase.from('profiles').update(data).eq('id', id);
      if (currentUser?.id === id) {
        setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
      }
    } catch (e) {
      console.warn('Failed to update profile:', e);
    }
  };

  // 6. SCOPE EXPENSES BY USER ROLE
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
    if (!currentUser || currentUser.role === 'employee') {
      return [];
    }
    return scopedExpenses.filter((e) => e.status === 'pending');
  }, [scopedExpenses, currentUser]);

  const value = {
    currentUser,
    setCurrentUser,
    profiles,
    isLoading,
    signInWithPassword,
    signUpWithEmail,
    signOut,
    settings,
    updateExchangeRate,
    categories,
    addCategory,
    toggleCategoryActive,
    allExpenses: expenses,
    scopedExpenses,
    pendingApprovals,
    addExpense,
    updateExpense,
    resubmitExpense,
    approveExpense,
    rejectExpense,
    deleteExpense,
    budgets,
    saveBudget,
    deleteBudget,
    addUser,
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
