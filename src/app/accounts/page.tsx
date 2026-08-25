'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { AccountModal } from '@/components/bookkeeping/AccountModal';
import { Account, AccountType } from '@/lib/types';
import { BookOpen, Plus, Shield, Search, Lock, Layers, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AccountsPage() {
  const { accounts, currentUser, isLoading } = useExpenses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Account | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Loading Chart of Accounts...</p>
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
          The Chart of Accounts and General Ledger are restricted to certified company accountants and administrators.
        </p>
        <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-cohere-near-black text-white text-xs font-medium">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const filteredAccounts = accounts.filter((acc) => {
    if (filterType !== 'all' && acc.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = acc.name.toLowerCase().includes(q);
      const matchCode = acc.code?.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const getTypeBadge = (type: AccountType) => {
    switch (type) {
      case 'asset':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">Asset (Debit)</span>;
      case 'liability':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-50 text-amber-800 border border-amber-200">Liability (Credit)</span>;
      case 'equity':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-50 text-purple-800 border border-purple-200">Equity (Credit)</span>;
      case 'income':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-50 text-blue-800 border border-blue-200">Income (Credit)</span>;
      case 'expense':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-soft-stone text-cohere-ink border border-cohere-card-border">Expense (Debit)</span>;
    }
  };

  const accountTypes: { id: AccountType; label: string; count: number }[] = [
    { id: 'asset', label: 'Assets', count: accounts.filter((a) => a.type === 'asset').length },
    { id: 'liability', label: 'Liabilities', count: accounts.filter((a) => a.type === 'liability').length },
    { id: 'equity', label: 'Equity', count: accounts.filter((a) => a.type === 'equity').length },
    { id: 'income', label: 'Income', count: accounts.filter((a) => a.type === 'income').length },
    { id: 'expense', label: 'Expenses', count: accounts.filter((a) => a.type === 'expense').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Double-Entry Taxonomy
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
            Chart of Accounts
          </h1>
          <p className="text-xs text-cohere-slate mt-0.5">
            Standard general ledger account hierarchy for real double-entry bookkeeping and balance sheet reporting.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedParent(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Ledger Account</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {accountTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterType(filterType === t.id ? 'all' : t.id)}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              filterType === t.id
                ? 'bg-cohere-soft-stone border-cohere-near-black shadow-xs'
                : 'bg-white border-cohere-hairline hover:border-black'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">{t.label}</div>
            <div className="text-xl font-bold font-mono text-cohere-ink mt-0.5">{t.count}</div>
            <div className="text-[10px] font-mono text-cohere-slate">Accounts</div>
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-cohere-hairline shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-cohere-slate absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="all">All Classifications</option>
          <option value="asset">Assets</option>
          <option value="liability">Liabilities</option>
          <option value="equity">Equity</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-cohere-hairline rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-cohere-hairline bg-cohere-soft-stone/40 text-[10px] font-mono uppercase text-cohere-slate tracking-wider">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Account Title</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cohere-hairline font-body">
            {filteredAccounts.map((acc) => {
              const isSubAccount = !!acc.parent_id;
              const parent = isSubAccount ? accounts.find((a) => a.id === acc.parent_id) : null;

              return (
                <tr key={acc.id} className="hover:bg-cohere-soft-stone/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-cohere-ink">
                    {acc.code || '—'}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {isSubAccount && (
                        <span className="text-cohere-muted-slate font-mono text-[11px] pl-3">↳</span>
                      )}
                      <div>
                        <div className="font-semibold text-cohere-ink">{acc.name}</div>
                        {parent && (
                          <div className="text-[10px] font-mono text-cohere-muted-slate">
                            Sub-account of {parent.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">{getTypeBadge(acc.type)}</td>

                  <td className="py-3 px-4 text-cohere-slate text-[11px] max-w-xs truncate">
                    {acc.description || 'Standard ledger taxonomy account'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {!isSubAccount && (acc.type === 'equity' || acc.type === 'asset') && (
                      <button
                        onClick={() => {
                          setSelectedParent(acc);
                          setIsModalOpen(true);
                        }}
                        className="text-[11px] font-mono text-cohere-action-blue hover:underline"
                      >
                        + Add Sub-Account
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AccountModal
          parentAccount={selectedParent}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedParent(null);
          }}
        />
      )}
    </div>
  );
}
