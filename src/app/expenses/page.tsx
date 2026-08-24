'use client';

import React, { useState, useMemo } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { Plus, Search, LogIn } from 'lucide-react';
import { formatBDT, calculateCurrencyBreakdown } from '@/lib/currency';
import Link from 'next/link';

export default function ExpensesPage() {
  const { scopedExpenses, categories, currentUser, isLoading } = useExpenses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCurrency, setSelectedCurrency] = useState('all');

  const filteredExpenses = useMemo(() => {
    return scopedExpenses.filter((exp) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesDesc = exp.description.toLowerCase().includes(q);
        const matchesSubmitter = exp.submitter?.name.toLowerCase().includes(q);
        const matchesCat = exp.category?.name.toLowerCase().includes(q);
        if (!matchesDesc && !matchesSubmitter && !matchesCat) return false;
      }
      // Category
      if (selectedCategory !== 'all' && exp.category_id !== selectedCategory) {
        return false;
      }
      // Status
      if (selectedStatus !== 'all' && exp.status !== selectedStatus) {
        return false;
      }
      // Currency
      if (selectedCurrency !== 'all' && exp.currency !== selectedCurrency) {
        return false;
      }
      return true;
    });
  }, [scopedExpenses, search, selectedCategory, selectedStatus, selectedCurrency]);

  const { usdTotal, bdtTotal, convertedGrandTotalBDT } = calculateCurrencyBreakdown(filteredExpenses);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Loading expenses...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold font-display text-cohere-ink">Sign In Required</h2>
        <p className="text-xs text-cohere-slate">Please sign in to view and log expenses.</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2 rounded-pill bg-cohere-near-black text-white text-xs font-semibold">
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Ledger & Entries
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
            Expense Registry
          </h1>
          <p className="text-xs text-cohere-slate mt-0.5">
            {currentUser.role === 'admin'
              ? 'Comprehensive company-wide expense records across all currencies.'
              : currentUser.role === 'manager'
              ? 'Expenses submitted by you and your managed team members.'
              : 'Your personal expense submissions, receipts, and review statuses.'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-cohere-hairline shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cohere-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, submitter, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink placeholder:text-cohere-muted-slate focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Currency Filter */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">USD & BDT</option>
            <option value="USD">USD ($) Only</option>
            <option value="BDT">BDT (৳) Only</option>
          </select>
        </div>

        {/* Quick summary line */}
        <div className="pt-2 border-t border-cohere-card-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-cohere-slate">
          <span>Showing <strong>{filteredExpenses.length}</strong> entries</span>
          <div className="flex items-center gap-3">
            <span>USD: <strong className="text-cohere-ink">${usdTotal.toFixed(2)}</strong></span>
            <span>BDT: <strong className="text-cohere-ink">৳{bdtTotal.toLocaleString()}</strong></span>
            <span>Total (Base BDT): <strong className="text-cohere-black font-bold">{formatBDT(convertedGrandTotalBDT)}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <ExpenseTable expenses={filteredExpenses} />

      {/* Modal */}
      {isModalOpen && <ExpenseFormModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
