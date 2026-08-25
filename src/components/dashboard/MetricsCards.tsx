'use client';

import React from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { formatBDT, formatUSD, calculateCurrencyBreakdown } from '@/lib/currency';
import { calculateCashBurnMetrics } from '@/lib/accounting';
import { Wallet, DollarSign, Clock, PieChart, TrendingUp, CreditCard, Coins, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MetricsCards() {
  const {
    scopedExpenses,
    pendingApprovals,
    unpaidPayables,
    journalEntries,
    accounts,
    currentUser,
    budgets,
    settings,
  } = useExpenses();

  const currentMonthPrefix = new Date().toISOString().substring(0, 7);

  const currentMonthExpenses = scopedExpenses.filter(
    (e) => e.expense_date.startsWith(currentMonthPrefix) && e.status !== 'rejected'
  );

  const { usdTotal, bdtTotal, convertedGrandTotalBDT } = calculateCurrencyBreakdown(currentMonthExpenses);

  const totalBudgetBDT = budgets.reduce((sum, b) => {
    if (b.period === 'month' && b.month_year === currentMonthPrefix) {
      const bdt = b.limit_currency === 'USD' ? b.limit_amount * settings.default_exchange_rate : b.limit_amount;
      return sum + bdt;
    }
    return sum;
  }, 0);

  const budgetUsagePercent = totalBudgetBDT > 0 ? Math.round((convertedGrandTotalBDT / totalBudgetBDT) * 100) : 0;

  const isFinancialUser = currentUser?.role === 'admin' || currentUser?.role === 'accountant';
  const cashBurn = calculateCashBurnMetrics(journalEntries, scopedExpenses, accounts);

  return (
    <div className="space-y-4">
      {/* Financial Executive Strip for Admin & Accountant */}
      {isFinancialUser && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Operating Cash */}
          <div className="bg-cohere-near-black text-white p-5 rounded-lg border border-black shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-cohere-soft-coral tracking-wider">
                  Operating Cash Balance
                </span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-white">
                {formatBDT(cashBurn.currentCashBalanceBDT)}
              </div>
              <div className="text-[10px] font-mono text-gray-300 mt-0.5">
                Settled in Bank Operating Account (1010)
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-gray-800 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Net Liquid: {formatBDT(cashBurn.netLiquidCashBDT)}</span>
              <Link href="/contributions" className="text-emerald-400 hover:underline flex items-center gap-1">
                <span>Inward Capital</span> &rarr;
              </Link>
            </div>
          </div>

          {/* Accounts Payable */}
          <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-cohere-muted-slate tracking-wider">
                  Accounts Payable (AP)
                </span>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-amber-700">
                {formatBDT(cashBurn.unpaidPayablesBDT)}
              </div>
              <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
                {unpaidPayables.length} approved unpaid bills
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-cohere-card-border">
              <Link
                href="/payables"
                className="text-[11px] font-mono font-semibold text-cohere-action-blue hover:underline flex items-center justify-between"
              >
                <span>Manage & Settle Payables</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Estimated Cash Runway */}
          <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-cohere-muted-slate tracking-wider">
                  Estimated Runway
                </span>
                <TrendingUp className="w-4 h-4 text-cohere-deep-green" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-cohere-ink">
                {cashBurn.runwayMonths === 999 ? 'Infinite' : `${cashBurn.runwayMonths.toFixed(1)} Months`}
              </div>
              <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
                Avg Burn: {formatBDT(cashBurn.averageMonthlyBurnBDT)} / mo
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-cohere-card-border">
              <Link
                href="/forecast"
                className="text-[11px] font-mono font-semibold text-cohere-deep-green hover:underline flex items-center justify-between"
              >
                <span>View 3/6/12M Forecast</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Operational Expense Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Grand Total Converted to BDT */}
        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm hover:border-cohere-near-black transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              Total Spend (Month)
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
              {currentUser?.role === 'employee' || currentUser?.role === 'accountant'
                ? scopedExpenses.filter((e) => e.status === 'pending').length
                : pendingApprovals.length}
            </span>
            <span className="text-xs text-cohere-slate">
              {currentUser?.role === 'employee' ? 'awaiting review' : 'pending review'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-cohere-card-border">
            {currentUser && currentUser.role !== 'employee' && currentUser.role !== 'accountant' ? (
              <Link
                href="/approvals"
                className="text-[11px] font-mono font-medium text-cohere-action-blue hover:underline flex items-center justify-between"
              >
                <span>Open approvals queue</span>
                <span>&rarr;</span>
              </Link>
            ) : (
              <span className="text-[11px] text-cohere-muted-slate font-mono">
                Auto-updates on review
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
    </div>
  );
}

export { MetricsCards };
