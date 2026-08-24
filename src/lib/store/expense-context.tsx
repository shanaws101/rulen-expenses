'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Profile,
  Category,
  Expense,
  Budget,
  ActivityLog,
  AppSettings,
  Role,
  Currency,
  ExpenseStatus,
  ExpenseWithDetails,
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_CATEGORIES,
  INITIAL_BUDGETS,
  INITIAL_EXPENSES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SETTINGS,
} from './initial-data';
import { convertToBDT } from '../currency';

interface ExpenseContextType {
  // Current user & profiles
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  profiles: Profile[];
  
  // Settings & Currency
  settings: AppSettings;
  updateExchangeRate: (newRate: number) => void;
  
  // Categories
  categories: Category[];
  addCategory: (name: string, description?: string) => void;
  toggleCategoryActive: (categoryId: string) => void;
  
  // Expenses & Scoping
  allExpenses: Expense[]; // raw list
  scopedExpenses: ExpenseWithDetails[]; // RLS-scoped with enriched submitter/category info
  pendingApprovals: ExpenseWithDetails[]; // Scoped pending items
  
  // Expense Actions
  addExpense: (data: {
    amount: number;
    currency: Currency;
    exchange_rate?: number;
    category_id: string;
    description: string;
    expense_date: string;
    receipt_url?: string | null;
  }) => Expense;
  updateExpense: (
    id: string,
    data: Partial<Omit<Expense, 'id' | 'created_at'>>
  ) => void;
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
  ) => void;
  approveExpense: (id: string, reviewNote?: string) => void;
  rejectExpense: (id: string, reviewNote: string) => void;
  deleteExpense: (id: string) => void;
  
  // Budgets
  budgets: Budget[];
  saveBudget: (data: {
    id?: string;
    category_id: string;
    period: 'month' | 'year';
    month_year: string;
    limit_amount: number;
    limit_currency: Currency;
  }) => void;
  deleteBudget: (id: string) => void;
  
  // Users & Team Management
  addUser: (userData: {
    name: string;
    email: string;
    role: Role;
    team_id?: string;
    manager_id?: string | null;
  }) => void;
  updateUser: (
    id: string,
    data: Partial<Omit<Profile, 'id' | 'created_at'>>
  ) => void;
  
  // Activity Logs
  activityLogs: ActivityLog[];
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const STORAGE_KEY = 'rulen_expenses_store_v1';

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  // Profiles
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [currentUser, setCurrentUser] = useState<Profile>(INITIAL_PROFILES[0]); // Default to Sarah Jenkins (Admin)
  
  // App Settings
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  
  // Categories
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  
  // Budgets
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  
  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  
  // Activity Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  // Load from localStorage on mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profiles) setProfiles(parsed.profiles);
        if (parsed.currentUser) {
          const matched = parsed.profiles?.find((p: Profile) => p.id === parsed.currentUser.id) || parsed.currentUser;
          setCurrentUser(matched);
        }
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.activityLogs) setActivityLogs(parsed.activityLogs);
      }
    } catch (e) {
      console.warn('Could not load from localStorage', e);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profiles,
          currentUser,
          settings,
          categories,
          budgets,
          expenses,
          activityLogs,
        })
      );
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [profiles, currentUser, settings, categories, budgets, expenses, activityLogs]);

  // Log activity helper
  const logActivity = (
    actorId: string,
    action: ActivityLog['action'],
    expenseId?: string | null,
    details?: Record<string, any>
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      expense_id: expenseId,
      actor_id: actorId,
      action,
      details,
      created_at: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // 1. UPDATE EXCHANGE RATE
  const updateExchangeRate = (newRate: number) => {
    setSettings((prev) => ({
      ...prev,
      default_exchange_rate: Number(newRate),
    }));
    logActivity(currentUser.id, 'updated_settings', null, {
      field: 'default_exchange_rate',
      value: newRate,
    });
  };

  // 2. CATEGORIES
  const addCategory = (name: string, description?: string) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || '',
      is_active: true,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);
    logActivity(currentUser.id, 'created_category', null, { categoryName: name });
  };

  const toggleCategoryActive = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, is_active: !c.is_active } : c))
    );
  };

  // 3. EXPENSES CRUD with RLS auto-rules
  const addExpense = (data: {
    amount: number;
    currency: Currency;
    exchange_rate?: number;
    category_id: string;
    description: string;
    expense_date: string;
    receipt_url?: string | null;
  }): Expense => {
    const isAdmin = currentUser.role === 'admin';
    const rate = data.exchange_rate && data.exchange_rate > 0 
      ? data.exchange_rate 
      : settings.default_exchange_rate;

    const newExpense: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);
    logActivity(currentUser.id, 'created', newExpense.id, {
      amount: newExpense.amount,
      currency: newExpense.currency,
      description: newExpense.description,
      autoApproved: isAdmin,
    });

    return newExpense;
  };

  const updateExpense = (
    id: string,
    data: Partial<Omit<Expense, 'id' | 'created_at'>>
  ) => {
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          return {
            ...exp,
            ...data,
            updated_at: new Date().toISOString(),
          };
        }
        return exp;
      })
    );
  };

  const resubmitExpense = (
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

    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          return {
            ...exp,
            amount: Number(data.amount),
            currency: data.currency,
            exchange_rate: rate,
            category_id: data.category_id,
            description: data.description.trim(),
            expense_date: data.expense_date,
            receipt_url: data.receipt_url || exp.receipt_url,
            status: 'pending', // reset to pending for review
            review_note: null,
            reviewed_by: null,
            reviewed_at: null,
            updated_at: new Date().toISOString(),
          };
        }
        return exp;
      })
    );
    logActivity(currentUser.id, 'resubmitted', id, {
      amount: data.amount,
      currency: data.currency,
    });
  };

  const approveExpense = (id: string, reviewNote?: string) => {
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          return {
            ...exp,
            status: 'approved',
            reviewed_by: currentUser.id,
            reviewed_at: new Date().toISOString(),
            review_note: reviewNote?.trim() || 'Approved',
            updated_at: new Date().toISOString(),
          };
        }
        return exp;
      })
    );
    logActivity(currentUser.id, 'approved', id, { note: reviewNote });
  };

  const rejectExpense = (id: string, reviewNote: string) => {
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          return {
            ...exp,
            status: 'rejected',
            reviewed_by: currentUser.id,
            reviewed_at: new Date().toISOString(),
            review_note: reviewNote.trim(),
            updated_at: new Date().toISOString(),
          };
        }
        return exp;
      })
    );
    logActivity(currentUser.id, 'rejected', id, { note: reviewNote });
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  // 4. BUDGETS
  const saveBudget = (data: {
    id?: string;
    category_id: string;
    period: 'month' | 'year';
    month_year: string;
    limit_amount: number;
    limit_currency: Currency;
  }) => {
    if (data.id) {
      setBudgets((prev) =>
        prev.map((b) => (b.id === data.id ? { ...b, ...data } : b))
      );
    } else {
      const newBudget: Budget = {
        id: `b-${Date.now()}`,
        category_id: data.category_id,
        period: data.period,
        month_year: data.month_year,
        limit_amount: Number(data.limit_amount),
        limit_currency: data.limit_currency,
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
      };
      setBudgets((prev) => [...prev, newBudget]);
    }
    logActivity(currentUser.id, 'updated_budget', null, {
      category_id: data.category_id,
      amount: data.limit_amount,
      currency: data.limit_currency,
    });
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  // 5. USER / TEAM MANAGEMENT
  const addUser = (userData: {
    name: string;
    email: string;
    role: Role;
    team_id?: string;
    manager_id?: string | null;
  }) => {
    const newUser: Profile = {
      id: `user-${Date.now()}`,
      name: userData.name.trim(),
      email: userData.email.trim(),
      role: userData.role,
      team_id: userData.team_id || 'Engineering',
      manager_id: userData.manager_id || null,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
      created_at: new Date().toISOString(),
    };
    setProfiles((prev) => [...prev, newUser]);
    logActivity(currentUser.id, 'created_user', null, { name: newUser.name, email: newUser.email, role: newUser.role });
  };

  const updateUser = (id: string, data: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...data }));
    }
  };

  // 6. ENRICH & RLS SCOPE EXPENSES
  // Role Scoping Rules:
  // - Admin: All expenses
  // - Manager: Expenses submitted by self OR employees who have manager_id == currentUser.id
  // - Employee: Expenses submitted by self only
  const scopedExpenses = useMemo<ExpenseWithDetails[]>(() => {
    let filtered = expenses;

    if (currentUser.role === 'employee') {
      filtered = expenses.filter((e) => e.submitted_by === currentUser.id);
    } else if (currentUser.role === 'manager') {
      const managedEmployeeIds = profiles
        .filter((p) => p.manager_id === currentUser.id || p.id === currentUser.id)
        .map((p) => p.id);
      
      filtered = expenses.filter((e) => managedEmployeeIds.includes(e.submitted_by));
    }
    // Admins see all

    return filtered.map((e) => {
      const submitter = profiles.find((p) => p.id === e.submitted_by);
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

  // Scoped pending approvals:
  // - Admin: All pending expenses
  // - Manager: Pending expenses submitted by employees where manager_id == currentUser.id
  // - Employee: Empty (cannot approve)
  const pendingApprovals = useMemo<ExpenseWithDetails[]>(() => {
    if (currentUser.role === 'employee') {
      return [];
    }
    return scopedExpenses.filter((e) => e.status === 'pending');
  }, [scopedExpenses, currentUser]);

  const value = {
    currentUser,
    setCurrentUser,
    profiles,
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
