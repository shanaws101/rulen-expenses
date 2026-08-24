-- ============================================================================
-- RULEN EXPENSES - SUPABASE POSTGRESQL SCHEMA & ROW-LEVEL SECURITY POLICIES
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
  role text not null check (role in ('admin', 'manager', 'employee')),
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
-- 3. EXPENSES TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency in ('USD', 'BDT')),
  exchange_rate numeric(10, 4) not null default 122.50 check (exchange_rate > 0),
  category_id uuid not null references public.categories(id) on delete restrict,
  description text not null,
  expense_date date not null default current_date,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- 4. BUDGETS TABLE
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
-- 5. SETTINGS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- 6. ACTIVITY LOGS (AUDIT TRAIL)
-- ----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references public.expenses(id) on delete set null,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null, -- 'created', 'approved', 'rejected', 'resubmitted', 'updated_budget', 'updated_settings'
  details jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR RLS
-- ----------------------------------------------------------------------------

-- Function to get current user role
create or replace function public.get_auth_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Function to check if current user is admin
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

-- Function to check if current user is manager of submitter
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

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.settings enable row level security;
alter table public.activity_logs enable row level security;

-- PROFILES POLICIES
create policy "Users can view self profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins have full access to profiles"
  on public.profiles for all
  using (public.is_admin());

create policy "Managers can view their managed employees"
  on public.profiles for select
  using (manager_id = auth.uid());

-- CATEGORIES POLICIES
create policy "Authenticated users can read categories"
  on public.categories for select
  to authenticated
  using (true);

create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin());

-- EXPENSES POLICIES
-- 1. Select
create policy "Employees can view own expenses"
  on public.expenses for select
  using (
    submitted_by = auth.uid()
    or public.is_admin()
    or public.is_manager_of(submitted_by)
  );

-- 2. Insert (Admin submissions auto-approve via trigger or client)
create policy "Authenticated users can create expenses"
  on public.expenses for insert
  to authenticated
  with check (submitted_by = auth.uid());

-- 3. Update (Submitters can edit own rejected/pending; Managers can review team's; Admins can review all)
create policy "Users can update permitted expenses"
  on public.expenses for update
  using (
    (submitted_by = auth.uid() and status in ('pending', 'rejected'))
    or public.is_admin()
    or public.is_manager_of(submitted_by)
  );

-- 4. Delete (Admins or submitters of pending expenses)
create policy "Users can delete own pending or admins can delete any"
  on public.expenses for delete
  using (
    (submitted_by = auth.uid() and status = 'pending')
    or public.is_admin()
  );

-- BUDGETS POLICIES
create policy "Admins and managers can view budgets"
  on public.budgets for select
  to authenticated
  using (
    public.is_admin()
    or public.get_auth_role() = 'manager'
  );

create policy "Admins can manage budgets"
  on public.budgets for all
  using (public.is_admin());

-- SETTINGS POLICIES
create policy "Authenticated users can view settings"
  on public.settings for select
  to authenticated
  using (true);

create policy "Admins can update settings"
  on public.settings for all
  using (public.is_admin());

-- ACTIVITY LOGS POLICIES
create policy "Users can view their activity logs or admin/manager scoped"
  on public.activity_logs for select
  using (
    actor_id = auth.uid()
    or public.is_admin()
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
-- TRIGGERS & BUSINESS LOGIC
-- ----------------------------------------------------------------------------

-- Trigger to auto-approve admin expenses
create or replace function public.handle_admin_expense_auto_approve()
returns trigger
language plpgsql
security definer
as $$
begin
  if (select role from public.profiles where id = new.submitted_by) = 'admin' then
    new.status := 'approved';
    new.reviewed_by := new.submitted_by;
    new.reviewed_at := timezone('utc'::text, now());
    new.review_note := 'Auto-approved (Founder / Admin submission)';
  end if;
  return new;
end;
$$;

create or replace trigger on_expense_before_insert
  before insert on public.expenses
  for each row
  execute function public.handle_admin_expense_auto_approve();

-- Trigger to update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

create or replace trigger on_expense_update_timestamp
  before update on public.expenses
  for each row
  execute function public.set_updated_at();

-- Trigger to automatically create a profile when a new user signs up in Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  user_count int;
  assigned_role text;
begin
  select count(*) into user_count from public.profiles;
  -- If this is the first user, assign 'admin' role (Founder), otherwise default to 'employee' or metadata role
  if user_count = 0 then
    assigned_role := 'admin';
  else
    assigned_role := coalesce(new.raw_user_meta_data->>'role', 'employee');
  end if;

  insert into public.profiles (id, name, email, role, team_id, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    assigned_role,
    coalesce(new.raw_user_meta_data->>'team_id', 'Engineering'),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(new.email::bytea, 'hex'))
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- STORAGE SETUP (For Receipt Uploads)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

create policy "Public receipt read access"
  on storage.objects for select
  using (bucket_id = 'receipts');

create policy "Authenticated receipt upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts');

-- ----------------------------------------------------------------------------
-- SEED DATA
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

-- Seed default settings
insert into public.settings (key, value) values
  ('default_exchange_rate', '{"bdt_per_usd": 122.50, "updated_at": "2026-08-24T00:00:00Z"}'::jsonb),
  ('company_info', '{"name": "Rulen", "remote_only": true, "base_currency": "BDT"}'::jsonb)
on conflict (key) do nothing;
