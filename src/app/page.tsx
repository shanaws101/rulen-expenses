'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { SpendCharts } from '@/components/dashboard/SpendCharts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { Plus, ArrowRight, Shield, Layers, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentUser, pendingApprovals, scopedExpenses } = useExpenses();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Hero Declaration */}
      <div className="border-b border-cohere-hairline pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cohere-slate px-2 py-0.5 rounded bg-cohere-soft-stone border border-cohere-card-border">
                {currentUser.role === 'admin'
                  ? 'Founder / Executive Scope'
                  : currentUser.role === 'manager'
                  ? `${currentUser.team_id || 'Team'} Manager Scope`
                  : 'Employee Personal Scope'}
              </span>
              <span className="text-xs text-cohere-muted-slate font-mono">
                &middot; RLS Enforced
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-cohere-ink tracking-tight">
              Expense Operations Console
            </h1>
            <p className="text-sm text-cohere-slate mt-1 max-w-xl font-body">
              {currentUser.role === 'admin'
                ? 'Complete visibility into global company spending, multi-currency conversions, category budgets, and executive approvals.'
                : currentUser.role === 'manager'
                ? `Oversee and approve spending for the ${currentUser.team_id || 'managed'} team with converted BDT budget tracking.`
                : 'Log operational spending in USD or BDT, attach receipts, and monitor submission approval statuses.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentUser.role !== 'employee' && pendingApprovals.length > 0 && (
              <Link
                href="/approvals"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-pill bg-cohere-pale-green hover:bg-[#d5f5cb] text-cohere-deep-green border border-[#bce9b3] text-xs font-semibold font-body transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Review {pendingApprovals.length} Pending</span>
              </Link>
            )}

            <button
              onClick={() => setIsLogModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold font-body transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Metrics Cards */}
      <MetricsCards />

      {/* 2. Visual Spend Distribution Charts */}
      <SpendCharts />

      {/* 3. Recent Activity and Log Stream */}
      <RecentActivity />

      {/* Global Modal */}
      {isLogModalOpen && (
        <ExpenseFormModal onClose={() => setIsLogModalOpen(false)} />
      )}
    </div>
  );
}
