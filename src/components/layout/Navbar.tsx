'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, pendingApprovals, signOut, isLoading } = useExpenses();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    {
      href: '/approvals',
      label: 'Approvals',
      icon: CheckCircle2,
      badge: currentUser && currentUser.role !== 'employee' && pendingApprovals.length > 0 ? pendingApprovals.length : null,
      hidden: currentUser?.role === 'employee',
    },
    { href: '/budgets', label: 'Budgets', icon: PieChart },
    { href: '/reports', label: 'Reports', icon: FileBarChart },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      adminOnly: true,
    },
  ];

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
              <Link href="/" className="flex items-center gap-3 group">
                <img
                  src="/logo.png"
                  alt="Rulen Logo"
                  className="h-7 w-auto object-contain"
                />
                <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-cohere-soft-stone text-cohere-slate border border-cohere-card-border">
                  EXPENSES
                </span>
              </Link>

              {/* Navigation Links */}
              {currentUser && (
                <nav className="hidden md:flex items-center space-x-1">
                  {navLinks
                    .filter((item) => !item.hidden)
                    .map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                            isActive
                              ? 'text-cohere-black bg-cohere-soft-stone font-semibold'
                              : 'text-cohere-slate hover:text-cohere-ink hover:bg-[#f7f7f7]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cohere-coral text-white font-bold">
                              {item.badge}
                            </span>
                          )}
                          {item.adminOnly && currentUser.role !== 'admin' && (
                            <Lock className="w-2.5 h-2.5 text-cohere-muted-slate opacity-70" />
                          )}
                        </Link>
                      );
                    })}
                </nav>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  {/* Log Expense Primary CTA */}
                  <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium font-body transition-all shadow-sm active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Expense</span>
                  </button>

                  {/* Real User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-pill border border-cohere-hairline hover:border-black transition-colors bg-white text-xs"
                    >
                      <img
                        src={currentUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`}
                        alt={currentUser.name}
                        className="w-6 h-6 rounded-full object-cover border border-cohere-hairline"
                      />
                      <div className="hidden sm:flex flex-col text-left pr-1">
                        <span className="font-semibold text-cohere-ink leading-tight">{currentUser.name}</span>
                        <span className="text-[10px] font-mono uppercase text-cohere-muted-slate leading-tight">{currentUser.role}</span>
                      </div>
                    </button>

                    {isUserMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md border border-cohere-hairline shadow-lg z-50 p-2 animate-in fade-in">
                          <div className="px-3 py-2 border-b border-cohere-hairline">
                            <div className="font-semibold text-xs text-cohere-ink">{currentUser.name}</div>
                            <div className="text-[11px] font-mono text-cohere-muted-slate truncate">{currentUser.email}</div>
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-soft-stone text-cohere-ink">
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
