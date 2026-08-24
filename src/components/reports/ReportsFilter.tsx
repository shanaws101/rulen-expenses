'use client';

import React from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Currency, ExpenseStatus } from '@/lib/types';
import { Filter, Download, RotateCcw } from 'lucide-react';

export interface ReportFilterState {
  dateRange: 'all' | 'this_month' | 'last_month' | 'last_90_days' | 'this_year' | 'custom';
  startDate: string;
  endDate: string;
  categoryId: string;
  personId: string;
  status: 'all' | ExpenseStatus;
  currency: 'all' | Currency;
  searchQuery: string;
}

interface ReportsFilterProps {
  filters: ReportFilterState;
  onChange: (filters: ReportFilterState) => void;
  onExportCSV: () => void;
  filteredCount: number;
}

export function ReportsFilter({
  filters,
  onChange,
  onExportCSV,
  filteredCount,
}: ReportsFilterProps) {
  const { categories, profiles, currentUser } = useExpenses();

  const handleReset = () => {
    onChange({
      dateRange: 'all',
      startDate: '',
      endDate: '',
      categoryId: 'all',
      personId: 'all',
      status: 'all',
      currency: 'all',
      searchQuery: '',
    });
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm space-y-4">
      {/* Top row with search and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cohere-hairline">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cohere-slate" />
          <span className="text-xs font-mono uppercase font-semibold text-cohere-ink tracking-wider">
            Report Query Parameters
          </span>
          <span className="text-[11px] font-mono text-cohere-slate">
            ({filteredCount} records matching)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs text-cohere-slate hover:text-cohere-ink hover:bg-cohere-soft-stone font-body transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-pill bg-cohere-deep-green hover:bg-[#004f44] text-white text-xs font-medium font-body transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Date Preset */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) =>
              onChange({ ...filters, dateRange: e.target.value as ReportFilterState['dateRange'] })
            }
            className="w-full px-2.5 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month (Aug 2026)</option>
            <option value="last_month">Last Month (Jul 2026)</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="this_year">Year to Date (2026)</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
            Category
          </label>
          <select
            value={filters.categoryId}
            onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submitter (Admin/Manager only) */}
        {currentUser && currentUser.role !== 'employee' && (
          <div>
            <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
              Submitter
            </label>
            <select
              value={filters.personId}
              onChange={(e) => onChange({ ...filters, personId: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="all">All Team Members</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value as ReportFilterState['status'] })
            }
            className="w-full px-2.5 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
            Currency
          </label>
          <select
            value={filters.currency}
            onChange={(e) =>
              onChange({ ...filters, currency: e.target.value as ReportFilterState['currency'] })
            }
            className="w-full px-2.5 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">USD & BDT (Combined)</option>
            <option value="USD">USD ($) Only</option>
            <option value="BDT">BDT (৳) Only</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range Row */}
      {filters.dateRange === 'custom' && (
        <div className="pt-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cohere-slate">From:</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
              className="px-2 py-1 border border-cohere-border-light rounded text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cohere-slate">To:</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
              className="px-2 py-1 border border-cohere-border-light rounded text-xs font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
