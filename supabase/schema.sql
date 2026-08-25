-- ============================================================================
-- RULEN EXPENSES & FINANCIAL SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- Double-entry bookkeeping, payables, capital contributions, forecasting
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'manager', 'employee', 'accountant')),
  team_id text default 'Engineering',
  manager_id uuid references public.profiles(id) on delete set null,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.profiles is 'User profile data with role-based scoping references.';

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean default true not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- 3. EXPENSES TABLE (Extended with payables and dual cash/accrual dates)
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency in ('USD', 'BDT')),
  exchange_rate numeric(10, 4) not null default 122.50 check (exchange_rate > 0),
  category_id uuid not null references public.categories(id) on delete restrict,
  description text not null,
  expense_date date not null default current_date, -- entry_date (accrual)
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payment_status text not null default 'paid' check (payment_status in ('paid', 'unpaid')),
  due_date date,
  paid_date date, -- settled_date (cash)
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- 4. CHART OF ACCOUNTS (Double-entry ledger taxonomy)
-- ----------------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  type text not null check (type in ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id uuid references public.accounts(id) on delete set null,
  description text,
  is_active boolean default true not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- 5. JOURNAL ENTRIES (Accrual entry_date & Cash settled_date)
-- ----------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  settled_date date, -- Nullable, populated when cash moves
  description text not null,
  created_by uuid references public.profiles(id) on delete set null,
  source_type text not null check (source_type in ('expense', 'contribution', 'adjustment', 'manual')),
  source_id uuid, -- Links to expense or capital_contribution
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- 6. JOURNAL LINES (Double-entry debit/credit postings)
-- ----------------------------------------------------------------------------
create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  debit_amount numeric(12, 2) not null default 0 check (debit_amount >= 0),
  credit_amount numeric(12, 2) not null default 0 check (credit_amount >= 0),
  currency text not null default 'BDT' check (currency in ('USD', 'BDT')),
  exchange_rate numeric(10, 4) not null default 122.50 check (exchange_rate > 0),
  debit_bdt numeric(12, 2) not null default 0 check (debit_bdt >= 0),
  credit_bdt numeric(12, 2) not null default 0 check (credit_bdt >= 0),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- 7. CAPITAL CONTRIBUTIONS (Founder equity injections)
-- ----------------------------------------------------------------------------
create table if not exists public.capital_contributions (
  id uuid primary key default gen_random_uuid(),
  contributed_by uuid not null references public.profiles(id) on delete cascade,
  founder_account_id uuid references public.accounts(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency in ('USD', 'BDT')),
  exchange_rate numeric(10, 4) not null default 122.50 check (exchange_rate > 0),
  contribution_date date not null default current_date,
  settled_date date default current_date,
  method text not null default 'bank_transfer' check (method in ('bank_transfer', 'cash', 'other')),
  note text,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- 8. RECURRING ITEMS (SaaS subscriptions, hosting & forecasting seed)
-- ----------------------------------------------------------------------------
create table if not exists public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  vendor_name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency in ('USD', 'BDT')),
  exchange_rate numeric(10, 4) not null default 122.50,
  frequency text not null default 'monthly' check (frequency in ('monthly', 'quarterly', 'annual')),
  next_due_date date not null,
  is_active boolean default true not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- 9. BUDGETS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  period text not null default 'month' check (period in ('month', 'year')),
  month_year text not null, -- e.g. '2026-08'
  limit_amount numeric(12, 2) not null check (limit_amount >= 0),
  limit_currency text not null check (limit_currency in ('USD', 'BDT')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_category_period unique(category_id, period, month_year)
);

-- ----------------------------------------------------------------------------
-- 10. SETTINGS & AUDIT LOGS
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references public.expenses(id) on delete set null,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'manager', 'employee', 'accountant')),
  team_id text default 'Engineering',
  manager_id uuid references public.profiles(id) on delete set null,
  invited_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR RLS
-- ----------------------------------------------------------------------------
create or replace function public.get_auth_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_accountant()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'accountant'
  );
$$;

create or replace function public.has_financial_access()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'accountant')
  );
$$;

create or replace function public.is_manager_of(submitter_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = submitter_id and manager_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.capital_contributions enable row level security;
alter table public.recurring_items enable row level security;
alter table public.budgets enable row level security;
alter table public.settings enable row level security;
alter table public.activity_logs enable row level security;
alter table public.team_invitations enable row level security;

-- PROFILES
create policy "Users can view self profile"
  on public.profiles for select
  using (auth.uid() = id or public.has_financial_access() or public.is_manager_of(id));

create policy "Admins have full access to profiles"
  on public.profiles for all
  using (public.is_admin());

create policy "Users can insert self profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update self profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- CATEGORIES
create policy "Authenticated users can read categories"
  on public.categories for select
  to authenticated
  using (true);

create policy "Admins and accountants can manage categories"
  on public.categories for all
  using (public.has_financial_access());

-- EXPENSES
create policy "Scoped expense view"
  on public.expenses for select
  using (
    submitted_by = auth.uid()
    or public.has_financial_access()
    or public.is_manager_of(submitted_by)
  );

create policy "Authenticated users can create expenses"
  on public.expenses for insert
  to authenticated
  with check (submitted_by = auth.uid());

create policy "Users can update permitted expenses"
  on public.expenses for update
  using (
    (submitted_by = auth.uid() and status in ('pending', 'rejected'))
    or public.is_admin()
    or public.is_manager_of(submitted_by)
    or (public.is_accountant() and payment_status = 'unpaid')
  );

create policy "Users can delete own pending or admins can delete any"
  on public.expenses for delete
  using (
    (submitted_by = auth.uid() and status = 'pending')
    or public.is_admin()
  );

-- ACCOUNTS & GENERAL LEDGER
create policy "Financial users can view accounts"
  on public.accounts for select
  to authenticated
  using (public.has_financial_access());

create policy "Financial users can manage accounts"
  on public.accounts for all
  using (public.has_financial_access());

create policy "Financial users can view journal entries"
  on public.journal_entries for select
  to authenticated
  using (public.has_financial_access());

create policy "Financial users can create and edit journal entries"
  on public.journal_entries for all
  using (public.has_financial_access());

create policy "Financial users can view journal lines"
  on public.journal_lines for select
  to authenticated
  using (public.has_financial_access());

create policy "Financial users can manage journal lines"
  on public.journal_lines for all
  using (public.has_financial_access());

-- CAPITAL CONTRIBUTIONS
create policy "Financial users can view capital contributions"
  on public.capital_contributions for select
  to authenticated
  using (public.has_financial_access());

create policy "Admins can create capital contributions"
  on public.capital_contributions for all
  using (public.is_admin());

-- RECURRING ITEMS
create policy "Authenticated users can view recurring items"
  on public.recurring_items for select
  to authenticated
  using (true);

create policy "Financial users can manage recurring items"
  on public.recurring_items for all
  using (public.has_financial_access());

-- BUDGETS
create policy "Admins, accountants and managers can view budgets"
  on public.budgets for select
  to authenticated
  using (
    public.has_financial_access()
    or public.get_auth_role() = 'manager'
  );

create policy "Admins can manage budgets"
  on public.budgets for all
  using (public.is_admin());

-- SETTINGS
create policy "Authenticated users can view settings"
  on public.settings for select
  to authenticated
  using (true);

create policy "Admins can update settings"
  on public.settings for all
  using (public.is_admin());

-- TEAM INVITATIONS
create policy "Admins can manage team invitations"
  on public.team_invitations for all
  using (public.is_admin());

create policy "Anyone can read invitation by email"
  on public.team_invitations for select
  using (true);

-- ACTIVITY LOGS
create policy "Activity logs view access"
  on public.activity_logs for select
  using (
    actor_id = auth.uid()
    or public.has_financial_access()
    or exists (
      select 1 from public.expenses e
      where e.id = activity_logs.expense_id
      and (e.submitted_by = auth.uid() or public.is_manager_of(e.submitted_by))
    )
  );

create policy "Authenticated users can insert activity logs"
  on public.activity_logs for insert
  to authenticated
  with check (actor_id = auth.uid());

-- ----------------------------------------------------------------------------
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  user_count int;
  assigned_role text;
  assigned_name text;
  assigned_team text;
  assigned_manager uuid;
  inv_record record;
begin
  select count(*) into user_count from public.profiles;

  -- Check if user was pre-invited
  select * into inv_record from public.team_invitations where lower(email) = lower(new.email) limit 1;

  if inv_record.email is not null then
    assigned_role := inv_record.role;
    assigned_name := inv_record.name;
    assigned_team := inv_record.team_id;
    assigned_manager := inv_record.manager_id;
    update public.team_invitations set status = 'accepted' where id = inv_record.id;
  elsif user_count = 0 or user_count is null then
    -- First user is Founder / Admin
    assigned_role := 'admin';
    assigned_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
    assigned_team := 'Executive';
    assigned_manager := null;
  else
    assigned_role := coalesce(new.raw_user_meta_data->>'role', 'employee');
    assigned_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
    assigned_team := coalesce(new.raw_user_meta_data->>'team_id', 'Engineering');
    assigned_manager := null;
  end if;

  insert into public.profiles (id, name, email, role, team_id, manager_id, avatar_url)
  values (
    new.id,
    assigned_name,
    new.email,
    assigned_role,
    assigned_team,
    assigned_manager,
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(new.email::bytea, 'hex'))
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    team_id = excluded.team_id;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- SEED DATA (Chart of Accounts, Categories, Settings)
-- ----------------------------------------------------------------------------

-- Seed default categories
insert into public.categories (name, description, is_active) values
  ('Salary', 'Employee and contractor compensation', true),
  ('Marketing', 'Paid campaigns, ads, and promotions', true),
  ('Product Launch', 'Launch events, press releases, Product Hunt campaigns', true),
  ('Demo Video', 'Video production, voiceovers, animation', true),
  ('Branding & Logo', 'Graphic design, brand identity assets', true),
  ('Domain & Hosting', 'Vercel, Supabase, Cloudflare, domain renewals', true),
  ('AI Tools', 'OpenAI API, Anthropic, Midjourney, Cursor subscriptions', true),
  ('Testing', 'QA services, automated testing suites, device farms', true),
  ('Cloud & Deployment', 'AWS, GCP compute, Docker registries, CDN', true),
  ('Other', 'Miscellaneous operational expenses', true)
on conflict (name) do nothing;

-- Seed Chart of Accounts
insert into public.accounts (code, name, type, description, is_active) values
  ('1010', 'Cash / Bank Operating Account', 'asset', 'Primary operational bank account and digital wallets.', true),
  ('2010', 'Accounts Payable', 'liability', 'Approved unpaid contractor invoices and vendor payables.', true),
  ('3000', 'Founder Capital', 'equity', 'Total invested capital contributed by founders.', true),
  ('3010', 'Founder Capital — Founder 1', 'equity', 'Capital contributions from Founder 1.', true),
  ('3020', 'Founder Capital — Founder 2', 'equity', 'Capital contributions from Founder 2.', true),
  ('4010', 'Founder Contributions', 'income', 'Inward funding infusions for remote company runway.', true),
  ('5010', 'Salary & Compensation Expense', 'expense', 'Employee wages and contractor compensation.', true),
  ('5020', 'Marketing & Advertising Expense', 'expense', 'Paid campaigns, ads, influencer promotions.', true),
  ('5030', 'Product Launch Expense', 'expense', 'Launch events, press releases, Product Hunt promotions.', true),
  ('5040', 'Demo Video Production Expense', 'expense', 'Video editing, 3D motion graphics, voiceovers.', true),
  ('5050', 'Branding & Logo Design Expense', 'expense', 'Brand identity assets, typography, design assets.', true),
  ('5060', 'Domain & Web Hosting Expense', 'expense', 'Vercel, Supabase, Cloudflare, domains.', true),
  ('5070', 'AI Tools & API Subscriptions', 'expense', 'OpenAI, Anthropic Claude, Cursor, Midjourney.', true),
  ('5080', 'QA & Testing Services Expense', 'expense', 'Automated test infrastructure, device labs, QA.', true),
  ('5090', 'Cloud & Infrastructure Compute', 'expense', 'AWS, GCP compute, Docker containers, CDN.', true),
  ('5100', 'Miscellaneous Operations Expense', 'expense', 'General administrative and remote office expenses.', true)
on conflict (code) do nothing;

-- Seed default settings
insert into public.settings (key, value) values
  ('default_exchange_rate', '{"bdt_per_usd": 122.50, "updated_at": "2026-08-24T00:00:00Z"}'::jsonb),
  ('company_info', '{"name": "Rulen", "remote_only": true, "base_currency": "BDT"}'::jsonb)
on conflict (key) do nothing;
