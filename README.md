# Rulen Expenses 

> Remote expense intelligence, multi-currency ledger, approvals orchestration, and budgeting for [Rulen](https://rulen.co). Built with **Next.js (App Router)**, **TypeScript**, **Supabase (PostgreSQL with Row-Level Security)**, and **Tailwind CSS**, adhering to the **Cohere Enterprise Design System**.

---

## 🌟 Features Overview

- **🛡️ 3-Tier Role-Based Access Control (RLS)**:
  - **Admin (Founders)**: Full company visibility, auto-approved expense logging, global approvals, category/budget management, exchange rate settings, user provisioning.
  - **Manager**: Scoped visibility into their assigned team members' spending, team approval queue with review notes, and team budget tracking.
  - **Employee**: Scoped strictly to own expenses, receipt upload, real-time status tracking (`pending`, `approved`, `rejected`), and rejected expense resubmission workflow.
  - **Interactive Persona / Role Switcher**: Quick-test banner in header to switch personas on the fly.
- **💱 Multi-Currency Core (USD & BDT)**:
  - Each expense captures original `amount`, `currency` (USD/BDT), and historical `exchange_rate`.
  - Admin-controlled default exchange rate (BDT per USD) that pre-fills new entries and aggregates overall company metrics in base currency **BDT**.
- **✅ Approvals Queue**: Fast 1-click Approve or Reject with feedback note, batch actions, and receipt preview.
- **📊 Category Budgets**: Monthly category limits with visual threshold indicators at **>80%** (warning) and **>100%** (critical alert).
- **📈 Financial Reports & Export**: Multi-facet filterable queries with instant **One-Click CSV Export**.
- **⚙️ Admin Settings**: Category taxonomy manager, Exchange rate updater, User & Manager assignment, and immutable Audit Activity Log.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Server & Client Components)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Storage
- **Styling**: Tailwind CSS (Cohere Design System)
- **Icons**: Lucide React
- **Deployment**: Vercel

---

## 🚀 Supabase Setup & Configuration

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Navigate to the **SQL Editor** tab in your Supabase project dashboard.
3. Open `supabase/schema.sql` from this repository, copy all contents, and click **Run**.
   - This creates the `profiles`, `categories`, `expenses`, `budgets`, `settings`, and `activity_logs` tables.
   - Sets up all PostgreSQL Row-Level Security (RLS) policies.
   - Sets up auto-approval triggers for Admins and updated timestamps.
   - Configures the `receipts` storage bucket with public read and authenticated upload policies.
   - Seeds initial categories and default exchange rates.

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_DEFAULT_EXCHANGE_RATE=122.50
```

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 🚢 Deploying to Vercel

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete rulen expenses app"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"** -> **"Import Git Repository"**.
3. Select your `rulen-expenses` repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_DEFAULT_EXCHANGE_RATE`
5. Click **Deploy**.

---

## 📄 License
Internal proprietary application for **Rulen**.
