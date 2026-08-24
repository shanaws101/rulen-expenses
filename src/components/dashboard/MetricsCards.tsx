'use client';

import React from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { formatBDT, formatUSD, calculateCurrencyBreakdown } from '@/lib/currency';
import { Wallet, DollarSign, Clock, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export function MetricsCards() {
  const { scopedExpenses, pendingApprovals, currentUser, budgets, settings } = useExpenses();

  // Current month expenses (Approved and Pending)
  const currentMonthPrefix = new Date().toISOString().substring(0, 7); // e.g. "2026-08"
  
  const currentMonthExpenses = scopedExpenses.filter(
    (e) => e.expense_date.startsWith(currentMonthPrefix) && e.status !== 'rejected'
  );

  const { usdTotal, bdtTotal, convertedGrandTotalBDT } = calculateCurrencyBreakdown(currentMonthExpenses);

  // Total budget limit converted to BDT
  const totalBudgetBDT = budgets.reduce((sum, b) => {
    if (b.period === 'month' && b.month_year === currentMonthPrefix) {
      const bdt = b.limit_currency === 'USD' ? b.limit_amount * settings.default_exchange_rate : b.limit_amount;
      return sum + bdt;
    }
    return sum;
  }, 0);

  const budgetUsagePercent = totalBudgetBDT > 0 ? Math.round((convertedGrandTotalBDT / totalBudgetBDT) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Grand Total Converted to BDT */}
      <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm hover:border-cohere-near-black transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Total Spend (Aug 2026)
          </span>
          <div className="w-7 h-7 rounded-full bg-cohere-pale-green text-cohere-deep-green flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold font-mono text-cohere-ink tracking-tight">
          {formatBDT(convertedGrandTotalBDT)}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-cohere-slate font-mono pt-2 border-t border-cohere-card-border">
          <span>Base Currency: BDT</span>
          <span className="text-cohere-deep-green font-semibold">
            {currentMonthExpenses.length} entries
          </span>
        </div>
      </div>

      {/* 2. Original Currency Breakdown */}
      <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm hover:border-cohere-near-black transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Multi-Currency Spend
          </span>
          <div className="w-7 h-7 rounded-full bg-cohere-pale-blue text-cohere-action-blue flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <div>
            <div className="text-lg font-bold font-mono text-cohere-ink">
              {formatUSD(usdTotal)}
            </div>
            <div className="text-[10px] font-mono text-cohere-muted-slate uppercase">USD Pool</div>
          </div>
          <div className="h-8 w-px bg-cohere-hairline" />
          <div>
            <div className="text-lg font-bold font-mono text-cohere-ink">
              {formatBDT(bdtTotal)}
            </div>
            <div className="text-[10px] font-mono text-cohere-muted-slate uppercase">BDT Pool</div>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-cohere-muted-slate font-mono pt-2 border-t border-cohere-card-border">
          Rate: 1 USD = {settings.default_exchange_rate.toFixed(2)} BDT
        </div>
      </div>

      {/* 3. Pending Approvals */}
      <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm hover:border-cohere-near-black transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Pending Approvals
          </span>
          <div className="w-7 h-7 rounded-full bg-[#fff8e6] text-amber-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-cohere-ink">
            {currentUser?.role === 'employee'
              ? scopedExpenses.filter((e) => e.status === 'pending').length
              : pendingApprovals.length}
          </span>
          <span className="text-xs text-cohere-slate">
            {currentUser?.role === 'employee' ? 'awaiting manager review' : 'requiring your review'}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-cohere-card-border">
          {currentUser && currentUser.role !== 'employee' ? (
            <Link
              href="/approvals"
              className="text-[11px] font-mono font-medium text-cohere-action-blue hover:underline flex items-center justify-between"
            >
              <span>Open approvals queue</span>
              <span>&rarr;</span>
            </Link>
          ) : (
            <span className="text-[11px] text-cohere-muted-slate font-mono">
              Auto-updates when approved
            </span>
          )}
        </div>
      </div>

      {/* 4. Budget Utilization */}
      <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm hover:border-cohere-near-black transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Monthly Budget Health
          </span>
          <div className="w-7 h-7 rounded-full bg-cohere-soft-stone text-cohere-ink flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-cohere-ink">
            {budgetUsagePercent}%
          </span>
          <span className="text-xs text-cohere-muted-slate">
            of {formatBDT(totalBudgetBDT)} limit
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-cohere-card-border">
          <div className="w-full bg-cohere-soft-stone h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                budgetUsagePercent > 100
                  ? 'bg-red-600'
                  : budgetUsagePercent > 80
                  ? 'bg-cohere-coral'
                  : 'bg-cohere-deep-green'
              }`}
              style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
