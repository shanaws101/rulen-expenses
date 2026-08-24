'use client';

import React, { useState, useMemo } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { ReportsFilter, ReportFilterState } from '@/components/reports/ReportsFilter';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { convertToBDT } from '@/lib/currency';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function ReportsPage() {
  const { scopedExpenses, currentUser, isLoading } = useExpenses();

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
      // 1. Date Range
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

      // 2. Category
      if (filters.categoryId !== 'all' && exp.category_id !== filters.categoryId) {
        return false;
      }

      // 3. Person (Submitter)
      if (filters.personId !== 'all' && exp.submitted_by !== filters.personId) {
        return false;
      }

      // 4. Status
      if (filters.status !== 'all' && exp.status !== filters.status) {
        return false;
      }

      // 5. Currency
      if (filters.currency !== 'all' && exp.currency !== filters.currency) {
        return false;
      }

      return true;
    });
  }, [scopedExpenses, filters]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = [
      'Expense ID',
      'Date',
      'Submitter Name',
      'Submitter Email',
      'Team',
      'Category',
      'Description',
      'Original Amount',
      'Currency',
      'Exchange Rate (BDT/USD)',
      'Converted Total (BDT)',
      'Status',
      'Reviewer Name',
      'Reviewed At',
      'Review Note',
      'Receipt Attachment URL',
    ];

    const rows = filteredExpenses.map((exp) => [
      `"${exp.id}"`,
      `"${exp.expense_date}"`,
      `"${exp.submitter?.name || 'Unknown'}"`,
      `"${exp.submitter?.email || ''}"`,
      `"${exp.submitter?.team_id || 'General'}"`,
      `"${exp.category?.name || 'Other'}"`,
      `"${(exp.description || '').replace(/"/g, '""')}"`,
      exp.amount,
      exp.currency,
      exp.exchange_rate,
      exp.converted_amount_bdt.toFixed(2),
      `"${exp.status.toUpperCase()}"`,
      `"${exp.reviewer?.name || ''}"`,
      `"${exp.reviewed_at || ''}"`,
      `"${(exp.review_note || '').replace(/"/g, '""')}"`,
      `"${exp.receipt_url || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `rulen_expenses_report_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Loading reports...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold font-display text-cohere-ink">Sign In Required</h2>
        <p className="text-xs text-cohere-slate">Please sign in to view and export reports.</p>
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
      <div className="pb-6 border-b border-cohere-hairline">
        <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
          Intelligence & Compliance
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight mt-0.5">
          Financial Reports & Export
        </h1>
        <p className="text-xs text-cohere-slate mt-0.5">
          Generate filtered financial statements with multi-currency conversion breakdowns and export CSVs for accounting.
        </p>
      </div>

      {/* Filter Parameters Console */}
      <ReportsFilter
        filters={filters}
        onChange={setFilters}
        onExportCSV={handleExportCSV}
        filteredCount={filteredExpenses.length}
      />

      {/* Results and Tables */}
      <ReportsTable expenses={filteredExpenses} />
    </div>
  );
}
