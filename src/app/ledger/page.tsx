'use client';

import React, { useState, useMemo } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { ManualJournalModal } from '@/components/bookkeeping/ManualJournalModal';
import { formatBDT } from '@/lib/currency';
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  CreditCard,
  Coins,
  FileText,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function GeneralLedgerPage() {
  const {
    journalEntries,
    accounts,
    currentUser,
    isLoading,
    accountingBasis,
    setAccountingBasis,
  } = useExpenses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [selectedSourceType, setSelectedSourceType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Loading General Ledger...</p>
      </div>
    );
  }

  const isFinancialUser = currentUser?.role === 'admin' || currentUser?.role === 'accountant';

  if (!isFinancialUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white p-8 rounded-lg border border-cohere-hairline shadow-sm space-y-4">
        <Lock className="w-8 h-8 text-cohere-muted-slate mx-auto" />
        <h2 className="text-xl font-display font-bold text-cohere-ink">Bookkeeping Clearance Required</h2>
        <p className="text-xs text-cohere-slate">
          The General Ledger is restricted to certified company accountants and administrators.
        </p>
        <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-cohere-near-black text-white text-xs font-medium">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Filter journal entries
  const filteredEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      // 1. Basis & Date filter
      const checkDate = accountingBasis === 'cash' ? entry.settled_date : entry.entry_date;
      if (accountingBasis === 'cash' && !entry.settled_date) {
        return false; // Cash basis ignores unsettled accruals
      }

      if (dateRange === 'this_month') {
        const thisMonth = new Date().toISOString().substring(0, 7);
        if (!checkDate?.startsWith(thisMonth)) return false;
      } else if (dateRange === 'this_year') {
        const thisYear = new Date().getFullYear().toString();
        if (!checkDate?.startsWith(thisYear)) return false;
      } else if (dateRange === 'custom') {
        if (startDate && checkDate && checkDate < startDate) return false;
        if (endDate && checkDate && checkDate > endDate) return false;
      }

      // 2. Source Type
      if (selectedSourceType !== 'all' && entry.source_type !== selectedSourceType) {
        return false;
      }

      // 3. Account Filter
      if (selectedAccountId !== 'all') {
        const hasAccount = entry.lines.some((l) => l.account_id === selectedAccountId);
        if (!hasAccount) return false;
      }

      // 4. Search text
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesDesc = entry.description.toLowerCase().includes(q);
        const matchesAccount = entry.lines.some((l) => {
          const acc = accounts.find((a) => a.id === l.account_id);
          return acc?.name.toLowerCase().includes(q) || acc?.code?.toLowerCase().includes(q);
        });
        if (!matchesDesc && !matchesAccount) return false;
      }

      return true;
    });
  }, [
    journalEntries,
    accountingBasis,
    dateRange,
    startDate,
    endDate,
    selectedSourceType,
    selectedAccountId,
    search,
    accounts,
  ]);

  // Calculate totals across filtered entries
  let totalDebitsBDT = 0;
  let totalCreditsBDT = 0;

  filteredEntries.forEach((e) => {
    e.lines.forEach((l) => {
      totalDebitsBDT += Number(l.debit_bdt) || 0;
      totalCreditsBDT += Number(l.credit_bdt) || 0;
    });
  });

  const diffBDT = Math.abs(totalDebitsBDT - totalCreditsBDT);
  const isReconciled = diffBDT < 0.01;

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'expense':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-soft-stone text-cohere-ink">Expense</span>;
      case 'contribution':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">Capital</span>;
      case 'adjustment':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-50 text-amber-800 border border-amber-200">Settlement</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-50 text-blue-800 border border-blue-200">Manual</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Double-Entry Accounting Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
            General Ledger
          </h1>
          <p className="text-xs text-cohere-slate mt-0.5">
            Audit-grade double-entry transaction journal with running account reconciliations and dual cash/accrual basis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Basis Toggle */}
          <div className="flex items-center p-0.5 rounded-pill bg-cohere-soft-stone border border-cohere-card-border text-xs font-mono">
            <button
              onClick={() => setAccountingBasis('accrual')}
              className={`px-3 py-1.5 rounded-pill transition-all ${
                accountingBasis === 'accrual'
                  ? 'bg-white text-cohere-ink shadow-xs font-bold'
                  : 'text-cohere-slate hover:text-cohere-ink'
              }`}
            >
              Accrual Basis (Entry Date)
            </button>
            <button
              onClick={() => setAccountingBasis('cash')}
              className={`px-3 py-1.5 rounded-pill transition-all ${
                accountingBasis === 'cash'
                  ? 'bg-white text-cohere-ink shadow-xs font-bold'
                  : 'text-cohere-slate hover:text-cohere-ink'
              }`}
            >
              Cash Basis (Settled Date)
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Reconciliation & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Total Journal Entries</div>
          <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
            {filteredEntries.length}
          </div>
          <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
            {accountingBasis === 'accrual' ? 'Accrued & Settled' : 'Settled Cash Only'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Total Debits (BDT)</div>
          <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
            {formatBDT(totalDebitsBDT)}
          </div>
          <div className="text-[10px] font-mono text-emerald-700">Assets & Expenses Incurred</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Total Credits (BDT)</div>
          <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
            {formatBDT(totalCreditsBDT)}
          </div>
          <div className="text-[10px] font-mono text-purple-700">Liabilities, Equity & Outflows</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Ledger Reconciliation</div>
            <div className="flex items-center gap-1.5 mt-1">
              {isReconciled ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled (0.00 BDT)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-red-50 text-red-800 border border-red-200">
                  Out of Balance: {formatBDT(diffBDT)}
                </span>
              )}
            </div>
          </div>
          <div className="text-[10px] font-mono text-cohere-slate mt-2">
            Every entry balances to zero
          </div>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white p-4 rounded-lg border border-cohere-hairline shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-cohere-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search memo or account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Account Filter */}
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Accounts (Consolidated GL)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code ? `${a.code} - ` : ''}{a.name}
              </option>
            ))}
          </select>

          {/* Source Type */}
          <select
            value={selectedSourceType}
            onChange={(e) => setSelectedSourceType(e.target.value)}
            className="px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Source Types</option>
            <option value="expense">Operational Expenses</option>
            <option value="contribution">Capital Contributions</option>
            <option value="adjustment">Payable Settlements</option>
            <option value="manual">Manual Adjustments</option>
          </select>

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-cohere-card-border">
            <span className="text-xs font-mono text-cohere-slate">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-cohere-border-light rounded bg-white"
            />
            <span className="text-xs font-mono text-cohere-slate">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-cohere-border-light rounded bg-white"
            />
          </div>
        )}
      </div>

      {/* Journal Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="py-16 text-center bg-white border border-cohere-hairline rounded-lg">
          <Layers className="w-8 h-8 text-cohere-muted-slate mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-cohere-ink font-display">No journal entries found</h3>
          <p className="text-xs text-cohere-slate mt-1 max-w-sm mx-auto">
            Log an expense, record a founder capital contribution, or post a manual journal entry to start the ledger.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const entryDateDisplay = entry.entry_date;
            const settledDateDisplay = entry.settled_date;

            return (
              <div
                key={entry.id}
                className="bg-white border border-cohere-hairline rounded-lg shadow-sm overflow-hidden"
              >
                {/* Entry Header */}
                <div className="px-5 py-3.5 bg-cohere-soft-stone/40 border-b border-cohere-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-cohere-ink">
                      {accountingBasis === 'cash' ? settledDateDisplay : entryDateDisplay}
                    </span>
                    {getSourceBadge(entry.source_type)}
                    <span className="font-semibold text-cohere-ink">{entry.description}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-cohere-muted-slate">
                    <span>Accrued: {entryDateDisplay}</span>
                    {settledDateDisplay ? (
                      <span className="text-emerald-700 font-medium">&middot; Settled: {settledDateDisplay}</span>
                    ) : (
                      <span className="text-amber-700 font-medium">&middot; Unsettled AP</span>
                    )}
                  </div>
                </div>

                {/* Lines Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-cohere-hairline bg-cohere-soft-stone/20 text-[10px] font-mono uppercase text-cohere-slate">
                        <th className="py-2 px-5">Account Code & Title</th>
                        <th className="py-2 px-4 w-28 text-right">Original</th>
                        <th className="py-2 px-4 w-36 text-right">Debit (BDT)</th>
                        <th className="py-2 px-4 w-36 text-right">Credit (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cohere-hairline font-mono">
                      {entry.lines.map((line) => {
                        const account = accounts.find((a) => a.id === line.account_id);
                        const isDebit = Number(line.debit_bdt) > 0;

                        return (
                          <tr key={line.id} className="hover:bg-cohere-soft-stone/10">
                            <td className="py-2.5 px-5 font-body">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-cohere-slate">
                                  {account?.code || '—'}
                                </span>
                                <span className="font-medium text-cohere-ink">
                                  {account?.name || 'Unknown Account'}
                                </span>
                                <span className="text-[10px] font-mono uppercase px-1 rounded bg-cohere-soft-stone text-cohere-slate">
                                  {account?.type}
                                </span>
                              </div>
                            </td>

                            <td className="py-2.5 px-4 text-right text-cohere-slate text-[11px]">
                              {line.currency === 'USD'
                                ? `$${(isDebit ? line.debit_amount : line.credit_amount).toFixed(2)}`
                                : '—'}
                            </td>

                            <td className="py-2.5 px-4 text-right font-bold text-cohere-ink">
                              {Number(line.debit_bdt) > 0 ? formatBDT(Number(line.debit_bdt)) : '—'}
                            </td>

                            <td className="py-2.5 px-4 text-right font-bold text-cohere-ink">
                              {Number(line.credit_bdt) > 0 ? formatBDT(Number(line.credit_bdt)) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Journal Modal */}
      {isModalOpen && <ManualJournalModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
