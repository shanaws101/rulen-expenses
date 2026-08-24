import { Category, Profile, Expense, Budget, ActivityLog, AppSettings } from '../types';

export const INITIAL_PROFILES: Profile[] = [];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-salary', name: 'Salary', description: 'Employee and contractor payroll compensation', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-marketing', name: 'Marketing', description: 'Digital ad spend, sponsorships, and paid acquisition', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-launch', name: 'Product Launch', description: 'Launch campaigns, Product Hunt promotions, and PR', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-demo', name: 'Demo Video', description: '3D renders, video production, voiceover, and editing', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-brand', name: 'Branding & Logo', description: 'Visual design, custom typography, asset licensing', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-hosting', name: 'Domain & Hosting', description: 'Vercel, Supabase, Cloudflare, domain renewals', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-ai', name: 'AI Tools', description: 'OpenAI API, Anthropic Claude, Cursor IDE, Midjourney', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-testing', name: 'Testing', description: 'QA device farms, automated testing, load testing', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-cloud', name: 'Cloud & Deployment', description: 'AWS, GCP compute, Docker registries, storage', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-other', name: 'Other', description: 'General operational and administrative expenses', is_active: true, created_at: new Date().toISOString() },
];

export const INITIAL_SETTINGS: AppSettings = {
  default_exchange_rate: 122.5,
  company_name: 'Rulen',
  base_currency: 'BDT',
};

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
