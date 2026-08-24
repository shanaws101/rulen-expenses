'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useExpenses } from '@/lib/store/expense-context';
import { RoleSwitcher } from './RoleSwitcher';
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
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, pendingApprovals } = useExpenses();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    {
      href: '/approvals',
      label: 'Approvals',
      icon: CheckCircle2,
      badge: currentUser.role !== 'employee' && pendingApprovals.length > 0 ? pendingApprovals.length : null,
      hidden: currentUser.role === 'employee', // Employees don't have an approvals queue
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

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-cohere-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-sm bg-cohere-near-black text-white flex items-center justify-center font-display font-bold text-sm tracking-tight group-hover:bg-cohere-deep-green transition-colors">
                  R
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-base tracking-tight text-cohere-ink flex items-center gap-1.5 leading-none">
                    RULEN
                    <span className="text-[10px] font-mono font-normal uppercase px-1.5 py-0.5 rounded bg-cohere-soft-stone text-cohere-slate border border-cohere-card-border">
                      EXPENSES
                    </span>
                  </span>
                  <span className="text-[10px] text-cohere-muted-slate font-mono mt-0.5">
                    Remote Expense Ops
                  </span>
                </div>
              </Link>

              {/* Navigation Links */}
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
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Persona switcher */}
              <RoleSwitcher />

              {/* Primary action CTA */}
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium font-body transition-all shadow-sm active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Expense</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-cohere-hairline py-2 bg-white px-2 overflow-x-auto">
          {navLinks
            .filter((item) => !item.hidden)
            .map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded text-[11px] font-body ${
                    isActive ? 'text-cohere-black font-semibold' : 'text-cohere-slate'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 px-1 py-0.1 rounded-full text-[9px] font-mono bg-cohere-coral text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </div>
      </header>

      {/* Global Log Expense Modal */}
      {isExpenseModalOpen && (
        <ExpenseFormModal onClose={() => setIsExpenseModalOpen(false)} />
      )}
    </>
  );
}
