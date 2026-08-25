'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  Layers,
} from 'lucide-react';

export function Navbar() {
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
  } = useExpenses();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBookkeepingOpen, setIsBookkeepingOpen] = useState(false);

  const isFinancialUser = currentUser?.role === 'admin' || currentUser?.role === 'accountant';

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-cohere-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6">
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

              {/* Navigation Links */}
              {currentUser && (
                <nav className="hidden lg:flex items-center space-x-1">
                  {/* Dashboard */}
                  <Link
                    href="/"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                      pathname === '/'
                        ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                        : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </Link>

                  {/* Expenses */}
                  <Link
                    href="/expenses"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                      pathname === '/expenses'
                        ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                        : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Expenses</span>
                  </Link>

                  {/* Approvals (Admin & Manager only) */}
                  {currentUser.role !== 'employee' && currentUser.role !== 'accountant' && (
                    <Link
                      href="/approvals"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                        pathname === '/approvals'
                          ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                          : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approvals</span>
                      {pendingApprovals.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cohere-coral text-white font-bold">
                          {pendingApprovals.length}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Accounts Payable (Admin & Accountant) */}
                  {isFinancialUser && (
                    <Link
                      href="/payables"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                        pathname === '/payables'
                          ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                          : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Payables</span>
                      {unpaidPayables.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-600 text-white font-bold">
                          {unpaidPayables.length}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Bookkeeping Dropdown (Admin & Accountant) */}
                  {isFinancialUser && (
                    <div className="relative">
                      <button
                        onClick={() => setIsBookkeepingOpen(!isBookkeepingOpen)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                          pathname.startsWith('/ledger') ||
                          pathname.startsWith('/accounts') ||
                          pathname.startsWith('/contributions')
                            ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                            : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Bookkeeping</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>

                      {isBookkeepingOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsBookkeepingOpen(false)}
                          />
                          <div className="absolute left-0 mt-1 w-52 bg-white rounded-md border border-cohere-hairline shadow-lg z-50 p-1.5 animate-in fade-in space-y-0.5">
                            <Link
                              href="/ledger"
                              onClick={() => setIsBookkeepingOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded text-xs text-cohere-ink hover:bg-cohere-soft-stone/70 font-medium"
                            >
                              <Layers className="w-3.5 h-3.5 text-cohere-slate" />
                              <div>
                                <div className="font-semibold">General Ledger</div>
                                <div className="text-[10px] text-cohere-muted-slate font-mono">Balanced double-entry journal</div>
                              </div>
                            </Link>

                            <Link
                              href="/accounts"
                              onClick={() => setIsBookkeepingOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded text-xs text-cohere-ink hover:bg-cohere-soft-stone/70 font-medium"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-cohere-slate" />
                              <div>
                                <div className="font-semibold">Chart of Accounts</div>
                                <div className="text-[10px] text-cohere-muted-slate font-mono">Assets, Liabilities, Equity</div>
                              </div>
                            </Link>

                            <Link
                              href="/contributions"
                              onClick={() => setIsBookkeepingOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded text-xs text-cohere-ink hover:bg-cohere-soft-stone/70 font-medium"
                            >
                              <Coins className="w-3.5 h-3.5 text-cohere-slate" />
                              <div>
                                <div className="font-semibold">Capital Contributions</div>
                                <div className="text-[10px] text-cohere-muted-slate font-mono">Founder inward equity</div>
                              </div>
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Budgets */}
                  <Link
                    href="/budgets"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                      pathname === '/budgets'
                        ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                        : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5" />
                    <span>Budgets</span>
                  </Link>

                  {/* Forecast */}
                  <Link
                    href="/forecast"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                      pathname === '/forecast'
                        ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                        : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Forecast</span>
                  </Link>

                  {/* Renewals */}
                  <Link
                    href="/renewals"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                      pathname === '/renewals'
                        ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                        : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Renewals</span>
                  </Link>

                  {/* Reports & Balance Sheet */}
                  <Link
                    href="/reports"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                      pathname.startsWith('/reports')
                        ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                        : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                    }`}
                  >
                    <FileBarChart className="w-3.5 h-3.5" />
                    <span>Reports</span>
                  </Link>

                  {/* Settings (Admin only) */}
                  {currentUser.role === 'admin' && (
                    <Link
                      href="/settings"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                        pathname === '/settings'
                          ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                          : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Settings</span>
                    </Link>
                  )}
                </nav>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  {/* Dual Basis Toggle for Accountant & Admin */}
                  {isFinancialUser && (
                    <div className="hidden sm:flex items-center p-0.5 rounded-pill bg-cohere-soft-stone border border-cohere-card-border text-[11px] font-mono">
                      <button
                        onClick={() => setAccountingBasis('accrual')}
                        className={`px-2.5 py-1 rounded-pill transition-all font-medium ${
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
                        className={`px-2.5 py-1 rounded-pill transition-all font-medium ${
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

                  {/* Log Expense Primary CTA */}
                  <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium font-body transition-all shadow-sm active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Expense</span>
                  </button>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-pill border border-cohere-hairline hover:border-black transition-colors bg-white text-xs"
                    >
                      <img
                        src={
                          currentUser.avatar_url ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            currentUser.name
                          )}`
                        }
                        alt={currentUser.name}
                        className="w-6 h-6 rounded-full object-cover border border-cohere-hairline"
                      />
                      <div className="hidden md:flex flex-col text-left pr-1">
                        <span className="font-semibold text-cohere-ink leading-tight">
                          {currentUser.name}
                        </span>
                        <span className="text-[10px] font-mono uppercase text-cohere-muted-slate leading-tight">
                          {currentUser.role}
                        </span>
                      </div>
                    </button>

                    {isUserMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-60 bg-white rounded-md border border-cohere-hairline shadow-lg z-50 p-2 animate-in fade-in">
                          <div className="px-3 py-2 border-b border-cohere-hairline">
                            <div className="font-semibold text-xs text-cohere-ink">{currentUser.name}</div>
                            <div className="text-[11px] font-mono text-cohere-muted-slate truncate">
                              {currentUser.email}
                            </div>
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-soft-stone text-cohere-ink">
                              <Shield className="w-2.5 h-2.5 text-cohere-coral" /> Role: {currentUser.role}
                            </div>
                          </div>

                          <div className="mt-1">
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-red-600 hover:bg-red-50 font-medium transition-colors text-left"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : !isLoading ? (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium font-body transition-all shadow-sm"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Global Log Expense Modal */}
      {isExpenseModalOpen && (
        <ExpenseFormModal onClose={() => setIsExpenseModalOpen(false)} />
      )}
    </>
  );
}
