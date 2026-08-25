'use client';

import React, { useState, useMemo } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { ReportsFilter, ReportFilterState } from '@/components/reports/ReportsFilter';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { calculateBalanceSheet, calculateCashBurnMetrics, calculateTrialBalance } from '@/lib/accounting';
import { formatBDT } from '@/lib/currency';
import {
  FileBarChart,
  Layers,
  Coins,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCw,
  TrendingUp,
  Shield,
  CreditCard,
  Building2,
  PieChart,
} from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const {
    scopedExpenses,
    journalEntries,
    accounts,
    currentUser,
    isLoading,
    accountingBasis,
    setAccountingBasis,
  } = useExpenses();

  const [activeTab, setActiveTab] = useState<'expenses' | 'balance_sheet' | 'cash_flow' | 'export'>('expenses');
  const [balanceSheetAsOf, setBalanceSheetAsOf] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Expense filters state
  const [filters, setFilters] = useState<ReportFilterState>({
    dateRange: 'all',
    startDate: '',
    endDate: '',
    categoryId: 'all',
    personId: 'all',
    status: 'all',
    currency: 'all',
    searchQuery: '',
  });

  const filteredExpenses = useMemo(() => {
    return scopedExpenses.filter((exp) => {
      if (filters.dateRange === 'this_month') {
        const thisMonth = new Date().toISOString().substring(0, 7);
        if (!exp.expense_date.startsWith(thisMonth)) return false;
      } else if (filters.dateRange === 'last_month') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const lastMonth = d.toISOString().substring(0, 7);
        if (!exp.expense_date.startsWith(lastMonth)) return false;
      } else if (filters.dateRange === 'this_year') {
        const thisYear = new Date().getFullYear().toString();
        if (!exp.expense_date.startsWith(thisYear)) return false;
      } else if (filters.dateRange === 'custom') {
        if (filters.startDate && exp.expense_date < filters.startDate) return false;
        if (filters.endDate && exp.expense_date > filters.endDate) return false;
      }

      if (filters.categoryId !== 'all' && exp.category_id !== filters.categoryId) return false;
      if (filters.personId !== 'all' && exp.submitted_by !== filters.personId) return false;
      if (filters.status !== 'all' && exp.status !== filters.status) return false;
      if (filters.currency !== 'all' && exp.currency !== filters.currency) return false;
      return true;
    });
  }, [scopedExpenses, filters]);

  // Balance Sheet Calculation
  const balanceSheet = useMemo(() => {
    return calculateBalanceSheet(
      journalEntries,
      accounts,
      balanceSheetAsOf,
      accountingBasis
    );
  }, [journalEntries, accounts, balanceSheetAsOf, accountingBasis]);

  // Cash Burn & Position Calculation
  const cashBurn = useMemo(() => {
    return calculateCashBurnMetrics(journalEntries, scopedExpenses, accounts);
  }, [journalEntries, scopedExpenses, accounts]);

  // Trial Balance Calculation for CPA Export
  const trialBalance = useMemo(() => {
    return calculateTrialBalance(journalEntries, accounts, balanceSheetAsOf, accountingBasis);
  }, [journalEntries, accounts, balanceSheetAsOf, accountingBasis]);

  // CSV Exporters
  const handleExportExpensesCSV = () => {
    if (filteredExpenses.length === 0) return alert('No records to export.');

    const headers = [
      'Expense ID',
      'Expense Date (Accrual)',
      'Paid Date (Cash)',
      'Payment Status',
      'Submitter Name',
      'Submitter Email',
      'Category',
      'Description',
      'Original Amount',
      'Currency',
      'Exchange Rate',
      'Converted BDT',
      'Status',
      'Reviewer',
      'Receipt URL',
    ];

    const rows = filteredExpenses.map((e) => [
      `"${e.id}"`,
      `"${e.expense_date}"`,
      `"${e.paid_date || ''}"`,
      `"${e.payment_status}"`,
      `"${e.submitter?.name || ''}"`,
      `"${e.submitter?.email || ''}"`,
      `"${e.category?.name || ''}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.amount,
      e.currency,
      e.exchange_rate,
      e.converted_amount_bdt.toFixed(2),
      `"${e.status.toUpperCase()}"`,
      `"${e.reviewer?.name || ''}"`,
      `"${e.receipt_url || ''}"`,
    ]);

    downloadCSV(headers, rows, `rulen_expenses_report_${new Date().toISOString().substring(0, 10)}.csv`);
  };

  const handleExportTrialBalanceCSV = () => {
    const headers = ['Account Code', 'Account Name', 'Classification', 'Debit (BDT)', 'Credit (BDT)', 'Net Balance (BDT)'];
    const rows = trialBalance.map((r) => [
      `"${r.account.code || ''}"`,
      `"${r.account.name}"`,
      `"${r.account.type.toUpperCase()}"`,
      r.debitTotal.toFixed(2),
      r.creditTotal.toFixed(2),
      (r.netDebit > 0 ? r.netDebit : -r.netCredit).toFixed(2),
    ]);

    downloadCSV(headers, rows, `rulen_trial_balance_${accountingBasis}_${balanceSheetAsOf}.csv`);
  };

  const handleExportGeneralLedgerCSV = () => {
    if (journalEntries.length === 0) return alert('No journal entries to export.');

    const headers = [
      'Entry ID',
      'Entry Date (Accrual)',
      'Settled Date (Cash)',
      'Source Type',
      'Description / Memo',
      'Account Code',
      'Account Title',
      'Debit (BDT)',
      'Credit (BDT)',
    ];

    const rows: string[][] = [];
    journalEntries.forEach((entry) => {
      entry.lines.forEach((l) => {
        const acc = accounts.find((a) => a.id === l.account_id);
        rows.push([
          `"${entry.id}"`,
          `"${entry.entry_date}"`,
          `"${entry.settled_date || ''}"`,
          `"${entry.source_type.toUpperCase()}"`,
          `"${entry.description.replace(/"/g, '""')}"`,
          `"${acc?.code || ''}"`,
          `"${acc?.name || 'Account'}"`,
          (Number(l.debit_bdt) || 0).toFixed(2),
          (Number(l.credit_bdt) || 0).toFixed(2),
        ]);
      });
    });

    downloadCSV(headers, rows, `rulen_general_ledger_${new Date().toISOString().substring(0, 10)}.csv`);
  };

  const downloadCSV = (headers: string[], rows: (string | number)[][], filename: string) => {
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Compiling financial statements...</p>
      </div>
    );
  }

  const isFinancialUser = currentUser?.role === 'admin' || currentUser?.role === 'accountant';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Audited Financial Reporting
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
            Financial Statements & Reports
          </h1>
          <p className="text-xs text-cohere-slate mt-0.5">
            Real double-entry balance sheets, cash runway telemetry, operational expense breakdowns, and CPA exports.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-cohere-soft-stone rounded-pill border border-cohere-card-border overflow-x-auto self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${
              activeTab === 'expenses'
                ? 'bg-white text-cohere-ink shadow-xs font-bold'
                : 'text-cohere-slate hover:text-cohere-ink'
            }`}
          >
            Expense Analysis
          </button>

          {isFinancialUser && (
            <>
              <button
                onClick={() => setActiveTab('balance_sheet')}
                className={`px-3.5 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${
                  activeTab === 'balance_sheet'
                    ? 'bg-white text-cohere-ink shadow-xs font-bold'
                    : 'text-cohere-slate hover:text-cohere-ink'
                }`}
              >
                Balance Sheet
              </button>

              <button
                onClick={() => setActiveTab('cash_flow')}
                className={`px-3.5 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${
                  activeTab === 'cash_flow'
                    ? 'bg-white text-cohere-ink shadow-xs font-bold'
                    : 'text-cohere-slate hover:text-cohere-ink'
                }`}
              >
                Cash & Burn
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`px-3.5 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${
                  activeTab === 'export'
                    ? 'bg-white text-cohere-ink shadow-xs font-bold'
                    : 'text-cohere-slate hover:text-cohere-ink'
                }`}
              >
                Accountant Export
              </button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: EXPENSE REPORTS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <ReportsFilter
            filters={filters}
            onChange={setFilters}
            onExportCSV={handleExportExpensesCSV}
            filteredCount={filteredExpenses.length}
          />

          <ReportsTable expenses={filteredExpenses} />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: BALANCE SHEET */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'balance_sheet' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-lg border border-cohere-hairline shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cohere-slate">As of Date:</span>
                <input
                  type="date"
                  value={balanceSheetAsOf}
                  onChange={(e) => setBalanceSheetAsOf(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono border border-cohere-border-light rounded-sm bg-white"
                />
              </div>

              {/* Basis Toggle */}
              <div className="flex items-center p-0.5 rounded-pill bg-cohere-soft-stone border border-cohere-card-border text-xs font-mono">
                <button
                  onClick={() => setAccountingBasis('accrual')}
                  className={`px-3 py-1 rounded-pill transition-all ${
                    accountingBasis === 'accrual'
                      ? 'bg-white text-cohere-ink shadow-xs font-bold'
                      : 'text-cohere-slate hover:text-cohere-ink'
                  }`}
                >
                  Accrual Basis
                </button>
                <button
                  onClick={() => setAccountingBasis('cash')}
                  className={`px-3 py-1 rounded-pill transition-all ${
                    accountingBasis === 'cash'
                      ? 'bg-white text-cohere-ink shadow-xs font-bold'
                      : 'text-cohere-slate hover:text-cohere-ink'
                  }`}
                >
                  Cash Basis
                </button>
              </div>
            </div>

            {/* Reconciliation Check */}
            <div className="flex items-center gap-2">
              {balanceSheet.isBalanced ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-pill bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Balanced: Assets = Liabilities + Equity
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-pill bg-red-50 text-red-800 border border-red-200 text-xs font-mono font-bold">
                  Imbalance: {formatBDT(balanceSheet.netDifference)}
                </span>
              )}
            </div>
          </div>

          {/* Statement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ASSETS */}
            <div className="bg-white rounded-lg border border-cohere-hairline shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 bg-cohere-soft-stone/40 border-b border-cohere-hairline flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase text-cohere-ink tracking-wider">
                    Assets (Debit Balances)
                  </h3>
                  <span className="text-xs font-mono font-bold text-cohere-deep-green">
                    {formatBDT(balanceSheet.assets.total)}
                  </span>
                </div>

                <div className="p-4 divide-y divide-cohere-hairline text-xs font-body">
                  {balanceSheet.assets.accounts.map((row) => (
                    <div key={row.account.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-cohere-ink">{row.account.name}</div>
                        <div className="text-[10px] font-mono text-cohere-muted-slate">{row.account.code || '1010'}</div>
                      </div>
                      <span className="font-mono font-bold text-cohere-ink">
                        {formatBDT(row.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-cohere-soft-stone/60 border-t border-cohere-hairline flex items-center justify-between font-mono font-bold text-sm">
                <span>Total Assets</span>
                <span className="text-cohere-deep-green">{formatBDT(balanceSheet.assets.total)}</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div className="bg-white rounded-lg border border-cohere-hairline shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                {/* Liabilities */}
                <div className="p-4 bg-cohere-soft-stone/40 border-b border-cohere-hairline flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase text-cohere-ink tracking-wider">
                    Liabilities (Credit Balances)
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    {formatBDT(balanceSheet.liabilities.total)}
                  </span>
                </div>

                <div className="p-4 divide-y divide-cohere-hairline text-xs font-body">
                  {balanceSheet.liabilities.accounts.map((row) => (
                    <div key={row.account.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-cohere-ink">{row.account.name}</div>
                        <div className="text-[10px] font-mono text-cohere-muted-slate">{row.account.code || '2010'}</div>
                      </div>
                      <span className="font-mono font-bold text-cohere-ink">
                        {formatBDT(row.balance)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Equity */}
                <div className="p-4 bg-cohere-soft-stone/40 border-y border-cohere-hairline flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase text-cohere-ink tracking-wider">
                    Founder Equity & Retained Earnings
                  </h3>
                  <span className="text-xs font-mono font-bold text-purple-800">
                    {formatBDT(balanceSheet.equity.total)}
                  </span>
                </div>

                <div className="p-4 divide-y divide-cohere-hairline text-xs font-body">
                  {balanceSheet.equity.accounts.map((row) => (
                    <div key={row.account.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-cohere-ink">{row.account.name}</div>
                        <div className="text-[10px] font-mono text-cohere-muted-slate">{row.account.code || '3000'}</div>
                      </div>
                      <span className="font-mono font-bold text-cohere-ink">
                        {formatBDT(row.balance)}
                      </span>
                    </div>
                  ))}

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-cohere-ink">Retained Earnings / Operational Deficit</div>
                      <div className="text-[10px] font-mono text-cohere-muted-slate">
                        Accumulated net income (Inward funding minus operational burn)
                      </div>
                    </div>
                    <span className="font-mono font-bold text-cohere-coral">
                      {formatBDT(balanceSheet.equity.retainedEarnings)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-cohere-soft-stone/60 border-t border-cohere-hairline flex items-center justify-between font-mono font-bold text-sm">
                <span>Total Liabilities & Equity</span>
                <span className="text-purple-900">
                  {formatBDT(balanceSheet.liabilities.total + balanceSheet.equity.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: CASH POSITION & BURN */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'cash_flow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
              <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Operating Cash Balance</div>
              <div className="text-2xl font-bold font-mono text-cohere-deep-green mt-1">
                {formatBDT(cashBurn.currentCashBalanceBDT)}
              </div>
              <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
                Settled in Bank Operating Account (1010)
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
              <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Accounts Payable (AP)</div>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
                {formatBDT(cashBurn.unpaidPayablesBDT)}
              </div>
              <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
                Outstanding approved liabilities
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
              <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Net Liquid Cash</div>
              <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
                {formatBDT(cashBurn.netLiquidCashBDT)}
              </div>
              <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
                Cash minus unpaid payables
              </div>
            </div>

            <div className="bg-cohere-near-black text-white p-5 rounded-lg border border-black shadow-sm">
              <div className="text-[10px] font-mono uppercase text-cohere-soft-coral">Estimated Runway</div>
              <div className="text-3xl font-bold font-mono text-white mt-1">
                {cashBurn.runwayMonths >= 99 ? 'Infinite' : `${cashBurn.runwayMonths.toFixed(1)} Months`}
              </div>
              <div className="text-[10px] font-mono text-gray-300 mt-0.5">
                Based on 3-month trailing burn
              </div>
            </div>
          </div>

          {/* Burn History Breakdown */}
          <div className="bg-white rounded-lg border border-cohere-hairline p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-cohere-ink">
              Trailing 3-Month Burn Rate Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {cashBurn.monthlyHistory.slice(0, 3).map((m, idx) => (
                <div key={idx} className="p-4 bg-cohere-soft-stone/40 rounded-lg border border-cohere-hairline">
                  <div className="text-xs font-mono font-bold text-cohere-ink">{m.month}</div>
                  <div className="text-xl font-bold font-mono text-cohere-coral mt-1">
                    {formatBDT(m.cashExpensesBDT)}
                  </div>
                  <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
                    Operational Cash Outflow
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-cohere-soft-stone/60 rounded flex items-center justify-between text-xs font-mono">
              <span className="text-cohere-slate">Trailing 3-Month Average Monthly Burn:</span>
              <strong className="text-cohere-black text-sm">
                {formatBDT(cashBurn.averageMonthlyBurnBDT)} / month
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: ACCOUNTANT CPA EXPORT */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-cohere-hairline shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-display font-bold text-cohere-ink">
                Certified Accountant & CPA Export Package
              </h3>
              <p className="text-xs text-cohere-slate mt-0.5">
                Export standard formatted accounting ledgers and statements ready for tax preparation and external audit.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* General Ledger CSV */}
              <div className="p-5 bg-cohere-soft-stone/30 rounded-lg border border-cohere-hairline space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-cohere-ink">
                    <Layers className="w-4 h-4 text-cohere-deep-green" /> General Ledger (GL)
                  </div>
                  <p className="text-[11px] text-cohere-slate mt-1">
                    Complete double-entry journal with debits, credits, entry dates, cash settlement dates, and memos.
                  </p>
                </div>
                <button
                  onClick={handleExportGeneralLedgerCSV}
                  className="w-full py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download GL CSV
                </button>
              </div>

              {/* Trial Balance CSV */}
              <div className="p-5 bg-cohere-soft-stone/30 rounded-lg border border-cohere-hairline space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-cohere-ink">
                    <CheckCircle2 className="w-4 h-4 text-cohere-deep-green" /> Trial Balance
                  </div>
                  <p className="text-[11px] text-cohere-slate mt-1">
                    Account-by-account summary of total debits, total credits, and net balances verifying ledger integrity.
                  </p>
                </div>
                <button
                  onClick={handleExportTrialBalanceCSV}
                  className="w-full py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Trial Balance CSV
                </button>
              </div>

              {/* Detailed Expenses CSV */}
              <div className="p-5 bg-cohere-soft-stone/30 rounded-lg border border-cohere-hairline space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-cohere-ink">
                    <FileBarChart className="w-4 h-4 text-cohere-deep-green" /> Expense Submissions
                  </div>
                  <p className="text-[11px] text-cohere-slate mt-1">
                    Full submission register with submitters, exchange rates, approval notes, and receipt URLs.
                  </p>
                </div>
                <button
                  onClick={handleExportExpensesCSV}
                  className="w-full py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Expenses CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
