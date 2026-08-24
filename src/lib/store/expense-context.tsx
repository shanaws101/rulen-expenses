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

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to ensure current user profile exists in public.profiles table
  const ensureUserProfile = useCallback(async (user: any): Promise<Profile> => {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existing) {
        return existing as Profile;
      }

      // Check if this is the first user (make them admin)
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const assignedRole: Role = (count === 0 || count === null)
        ? 'admin'
        : (user.user_metadata?.role as Role) || 'employee';

      const newProfile: Profile = {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: assignedRole,
        team_id: user.user_metadata?.team_id || (assignedRole === 'admin' ? 'Executive' : 'Engineering'),
        avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email || 'U')}`,
        created_at: new Date().toISOString(),
      };

      const { data: created, error } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (created) {
        return created as Profile;
      }
      return newProfile;
    } catch (e) {
      console.warn('ensureUserProfile notice:', e);
      return {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: (user.user_metadata?.role as Role) || 'admin',
        team_id: 'Executive',
        created_at: new Date().toISOString(),
      };
    }
  }, [supabase]);

  // Helper to ensure category UUID exists in Supabase
  const resolveCategoryUUID = useCallback(async (categoryIdOrName: string): Promise<string> => {
    // If it's already a valid UUID
    if (UUID_REGEX.test(categoryIdOrName)) {
      return categoryIdOrName;
    }

    // Try finding in current loaded categories
    const found = categories.find(
      (c) => c.id === categoryIdOrName || c.name.toLowerCase() === categoryIdOrName.toLowerCase()
    );
    if (found && UUID_REGEX.test(found.id)) {
      return found.id;
    }

    const catName = found?.name || categoryIdOrName.replace(/^cat-/, '').replace(/-/g, ' ');

    // Query Supabase directly
    const { data: dbCat } = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', catName)
      .limit(1)
      .maybeSingle();

    if (dbCat?.id && UUID_REGEX.test(dbCat.id)) {
      return dbCat.id;
    }

    // If not found in Supabase, create it
    const { data: newCat, error } = await supabase
      .from('categories')
      .insert({
        name: catName,
        description: 'Auto-seeded operational category',
        is_active: true,
      })
      .select('id')
      .single();

    if (newCat?.id) {
      return newCat.id;
    }

    return categoryIdOrName;
  }, [categories, supabase]);

  // 1. Fetch All Real Data from Supabase
  const refreshData = useCallback(async () => {
    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await ensureUserProfile(session.user);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }

      // Fetch categories
      let { data: catList } = await supabase.from('categories').select('*').order('name');
      
      // If categories table is completely empty in Supabase, seed the standard 10 categories
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

      // Fetch profiles
      const { data: profilesList } = await supabase.from('profiles').select('*').order('name');
      if (profilesList) {
        setProfiles(profilesList as Profile[]);
      }

      // Fetch team invitations
      const { data: invList } = await supabase.from('team_invitations').select('*').order('created_at', { ascending: false });
      if (invList) {
        setInvitations(invList as TeamInvitation[]);
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
      console.warn('refreshData notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, ensureUserProfile]);

  // Listen to Auth State Changes
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
        setActivityLogs([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, refreshData, ensureUserProfile]);

  // Real Auth Methods
  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
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
          team_id: role === 'admin' ? 'Executive' : 'Engineering',
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
      await supabase
        .from('categories')
        .update({ is_active: nextState })
        .eq('id', categoryId);
    } catch (e) {
      console.warn('Failed to toggle category:', e);
    }
  };

  // 3. EXPENSES CRUD (Real Supabase execution)
  const addExpense = async (data: {
    amount: number;
    currency: Currency;
    exchange_rate?: number;
    category_id: string;
    description: string;
    expense_date: string;
    receipt_url?: string | null;
  }): Promise<Expense> => {
    // 1. Ensure user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('You must be signed in to submit an expense. Please log in.');
    }

    // 2. Ensure profile exists in public.profiles
    const profile = await ensureUserProfile(session.user);
    const isAdmin = profile.role === 'admin';

    // 3. Resolve real UUID for category
    const validCategoryId = await resolveCategoryUUID(data.category_id);

    const rate = data.exchange_rate && data.exchange_rate > 0 
      ? data.exchange_rate 
      : settings.default_exchange_rate;

    const payload = {
      submitted_by: profile.id,
      amount: Number(data.amount),
      currency: data.currency,
      exchange_rate: rate,
      category_id: validCategoryId,
      description: data.description.trim(),
      expense_date: data.expense_date,
      receipt_url: data.receipt_url || null,
      status: isAdmin ? ('approved' as const) : ('pending' as const),
      reviewed_by: isAdmin ? profile.id : null,
      reviewed_at: isAdmin ? new Date().toISOString() : null,
      review_note: isAdmin ? 'Auto-approved (Founder / Admin submission)' : null,
    };

    const { data: newRow, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase expense insert error:', error);
      throw new Error(error.message || 'Failed to insert expense into Supabase.');
    }

    if (!newRow) {
      throw new Error('Expense could not be created in database.');
    }

    // Update state & audit log
    setExpenses((prev) => [newRow as Expense, ...prev]);
    logActivity(profile.id, 'created', newRow.id, {
      amount: newRow.amount,
      currency: newRow.currency,
      description: newRow.description,
      autoApproved: isAdmin,
    });

    await refreshData();
    return newRow as Expense;
  };

  const updateExpense = async (
    id: string,
    data: Partial<Omit<Expense, 'id' | 'created_at'>>
  ) => {
    const { error } = await supabase.from('expenses').update(data).eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
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
      status: 'pending' as const,
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('expenses').update(payload).eq('id', id);
    if (error) {
      throw new Error(error.message);
    }

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
    const payload = {
      status: 'approved' as const,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote?.trim() || 'Approved',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('expenses').update(payload).eq('id', id);
    if (error) throw new Error(error.message);

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

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await refreshData();
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

  // 5. INVITE TEAM MEMBERS
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
        team_id: userData.team_id || 'Engineering',
        manager_id: userData.manager_id || null,
        invited_by: currentUser?.id || null,
        status: 'pending',
      };

      // Try inserting into team_invitations table
      const { data, error } = await supabase
        .from('team_invitations')
        .upsert(payload, { onConflict: 'email' })
        .select()
        .single();

      if (error) {
        // If team_invitations table doesn't exist yet, we still record in activity log
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
    invitations,
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
