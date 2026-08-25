'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useExpenses } from '@/lib/store/expense-context';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import {
  LayoutDashboard,
  Receipt,
  CheckCircle2,
  PieChart,
  FileBarChart,
  Settings,
  Plus,
  Lock,
  LogOut,
  User,
  Shield,
  BookOpen,
  CreditCard,
  TrendingUp,
  RotateCw,
  Coins,
  Layers,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
  badgeColor?: string;
  hidden?: boolean;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    pendingApprovals,
    unpaidPayables,
    signOut,
    isLoading,
    accountingBasis,
    setAccountingBasis,
    settings,
  } = useExpenses();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isFinancialUser = currentUser?.role === 'admin' || currentUser?.role === 'accountant';

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Nav item groups
  const operationsGroup: NavLinkItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    {
      href: '/approvals',
      label: 'Approvals',
      icon: CheckCircle2,
      badge:
        currentUser && currentUser.role !== 'employee' && currentUser.role !== 'accountant' && pendingApprovals.length > 0
          ? pendingApprovals.length
          : null,
      badgeColor: 'bg-cohere-coral text-white',
      hidden: currentUser?.role === 'employee' || currentUser?.role === 'accountant',
    },
    {
      href: '/payables',
      label: 'Payables (AP)',
      icon: CreditCard,
      badge: isFinancialUser && unpaidPayables.length > 0 ? unpaidPayables.length : null,
      badgeColor: 'bg-amber-600 text-white',
      hidden: !isFinancialUser,
    },
  ];

  const bookkeepingGroup: NavLinkItem[] = [
    { href: '/ledger', label: 'General Ledger', icon: Layers },
    { href: '/accounts', label: 'Chart of Accounts', icon: BookOpen },
    { href: '/contributions', label: 'Capital Contributions', icon: Coins },
  ];

  const planningGroup: NavLinkItem[] = [
    { href: '/budgets', label: 'Budgets', icon: PieChart },
    { href: '/forecast', label: 'Forecast & Runway', icon: TrendingUp },
    { href: '/renewals', label: 'Upcoming Renewals', icon: RotateCw },
  ];

  const reportingGroup: NavLinkItem[] = [
    { href: '/reports', label: 'Financial Reports', icon: FileBarChart },
    {
      href: '/settings',
      label: 'Settings & Team',
      icon: Settings,
      hidden: currentUser?.role !== 'admin',
    },
  ];

  const renderNavLinks = (links: NavLinkItem[]) => {
    return links
      .filter((item) => !item.hidden)
      .map((item) => {
        const isActive =
          item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center justify-between px-3 py-2 rounded-md text-xs font-body font-medium transition-all ${
              isActive
                ? 'bg-cohere-soft-stone text-cohere-black font-semibold shadow-xs'
                : 'text-cohere-slate hover:text-cohere-ink hover:bg-cohere-soft-stone/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-cohere-black' : 'text-cohere-slate group-hover:text-cohere-ink'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>

            {item.badge ? (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${item.badgeColor || 'bg-cohere-near-black text-white'}`}
              >
                {item.badge}
              </span>
            ) : isActive ? (
              <ChevronRight className="w-3.5 h-3.5 text-cohere-slate opacity-60" />
            ) : null}
          </Link>
        );
      });
  };

  // Reusable Sidebar Content
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-cohere-hairline w-full">
      {/* 1. Header / Logo */}
      <div className="p-5 border-b border-cohere-hairline">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="Rulen Logo"
            className="h-7 w-auto object-contain"
          />
          <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cohere-soft-stone text-cohere-slate border border-cohere-card-border">
            FINANCIALS
          </span>
        </Link>

        {/* Dual Basis Toggle (Accrual vs Cash) */}
        {isFinancialUser && (
          <div className="mt-4 p-1 rounded-pill bg-cohere-soft-stone border border-cohere-card-border flex items-center text-[11px] font-mono">
            <button
              onClick={() => setAccountingBasis('accrual')}
              className={`flex-1 py-1 text-center rounded-pill transition-all ${
                accountingBasis === 'accrual'
                  ? 'bg-white text-cohere-ink shadow-xs font-bold'
                  : 'text-cohere-slate hover:text-cohere-ink'
              }`}
              title="Accrual Basis: recognized as of entry date"
            >
              Accrual
            </button>
            <button
              onClick={() => setAccountingBasis('cash')}
              className={`flex-1 py-1 text-center rounded-pill transition-all ${
                accountingBasis === 'cash'
                  ? 'bg-white text-cohere-ink shadow-xs font-bold'
                  : 'text-cohere-slate hover:text-cohere-ink'
              }`}
              title="Cash Basis: recognized as of settled date"
            >
              Cash
            </button>
          </div>
        )}

        {/* Primary CTA: Log Expense */}
        {currentUser && (
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold font-body transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        )}
      </div>

      {/* 2. Scrollable Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Operations */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-cohere-muted-slate font-semibold">
            Operations
          </div>
          {renderNavLinks(operationsGroup)}
        </div>

        {/* Bookkeeping & GL (Admins & Accountants) */}
        {isFinancialUser && (
          <div className="space-y-1 pt-2 border-t border-cohere-hairline/60">
            <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-cohere-muted-slate font-semibold">
              Bookkeeping & GL
            </div>
            {renderNavLinks(bookkeepingGroup)}
          </div>
        )}

        {/* Planning & Strategy */}
        <div className="space-y-1 pt-2 border-t border-cohere-hairline/60">
          <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-cohere-muted-slate font-semibold">
            Planning & Runway
          </div>
          {renderNavLinks(planningGroup)}
        </div>

        {/* Reporting & Admin */}
        <div className="space-y-1 pt-2 border-t border-cohere-hairline/60">
          <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-cohere-muted-slate font-semibold">
            Reports & Admin
          </div>
          {renderNavLinks(reportingGroup)}
        </div>
      </div>

      {/* 3. Footer / User & Rate Banner */}
      <div className="p-3 border-t border-cohere-hairline bg-cohere-soft-stone/30 space-y-2">
        {/* Rate pill */}
        <div className="px-3 py-1.5 rounded-md bg-white border border-cohere-card-border flex items-center justify-between text-[11px] font-mono text-cohere-slate">
          <span className="text-cohere-muted-slate">Exchange Rate</span>
          <span className="font-bold text-cohere-ink">$1 = ৳{settings.default_exchange_rate.toFixed(2)}</span>
        </div>

        {/* User Card */}
        {currentUser ? (
          <div className="p-2 rounded-md bg-white border border-cohere-card-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={
                  currentUser.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`
                }
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-cohere-hairline flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-cohere-ink truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-mono uppercase text-cohere-muted-slate truncate leading-tight">
                  {currentUser.role}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded text-cohere-slate hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : !isLoading ? (
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-pill bg-cohere-near-black text-white text-xs font-medium"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-cohere-soft-coral selection:text-black">
      {/* ------------------------------------------------------------- */}
      {/* 1. DESKTOP STICKY LEFT SIDEBAR (>= lg) */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE / TABLET TOP HEADER (< lg) */}
      {/* ------------------------------------------------------------- */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cohere-hairline px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-1 rounded-md text-cohere-slate hover:text-cohere-ink hover:bg-cohere-soft-stone transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Rulen Logo"
              className="h-6 w-auto object-contain"
            />
            <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-cohere-soft-stone text-cohere-slate border border-cohere-card-border">
              FINANCIALS
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isFinancialUser && (
            <div className="flex p-0.5 rounded-pill bg-cohere-soft-stone border border-cohere-card-border text-[10px] font-mono">
              <button
                onClick={() => setAccountingBasis(accountingBasis === 'accrual' ? 'cash' : 'accrual')}
                className="px-2 py-0.5 rounded-pill bg-white text-cohere-ink font-bold shadow-xs uppercase"
              >
                {accountingBasis}
              </button>
            </div>
          )}

          {currentUser && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill bg-cohere-near-black text-white text-xs font-medium shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log</span>
            </button>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. MOBILE SLIDE-OUT DRAWER (< lg) */}
      {/* ------------------------------------------------------------- */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white animate-in slide-in-from-left duration-200 shadow-2xl">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-cohere-slate hover:text-cohere-ink hover:bg-cohere-soft-stone"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <SidebarContent />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN CONTENT CONTAINER (Offset on Desktop) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>

        <footer className="border-t border-cohere-hairline py-6 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-cohere-muted-slate">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cohere-deep-green" />
              <span>Rulen Remote Operations &middot; Base BDT Multi-Currency Ledger</span>
            </div>
            <div>
              <span>Powered by Supabase RLS &middot; Cohere Enterprise Design</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Log Expense Modal */}
      {isExpenseModalOpen && (
        <ExpenseFormModal onClose={() => setIsExpenseModalOpen(false)} />
      )}
    </div>
  );
}
