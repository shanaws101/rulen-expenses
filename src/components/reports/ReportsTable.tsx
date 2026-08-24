'use client';

import React from 'react';
import { ExpenseWithDetails } from '@/lib/types';
import { formatBDT, formatUSD, formatCurrency, calculateCurrencyBreakdown } from '@/lib/currency';
import { ExpenseTable } from '../expenses/ExpenseTable';
import { FileSpreadsheet, BarChart2, DollarSign, Layers } from 'lucide-react';

interface ReportsTableProps {
  expenses: ExpenseWithDetails[];
}

export function ReportsTable({ expenses }: ReportsTableProps) {
  const { usdTotal, bdtTotal, convertedGrandTotalBDT } = calculateCurrencyBreakdown(expenses);

  const avgBDT = expenses.length > 0 ? Math.round(convertedGrandTotalBDT / expenses.length) : 0;

  return (
    <div className="space-y-6">
      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cohere-near-black text-white p-4 rounded-lg">
          <div className="text-[10px] font-mono uppercase text-cohere-soft-coral tracking-wider">
            Filtered Total (Base BDT)
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-white">
            {formatBDT(convertedGrandTotalBDT)}
          </div>
          <div className="text-[11px] font-mono text-gray-400 mt-1">
            Across {expenses.length} records
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-cohere-hairline">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            USD Component
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-cohere-ink">
            {formatUSD(usdTotal)}
          </div>
          <div className="text-[11px] font-mono text-cohere-slate mt-1">
            Original currency USD
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-cohere-hairline">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            BDT Component
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-cohere-ink">
            {formatBDT(bdtTotal)}
          </div>
          <div className="text-[11px] font-mono text-cohere-slate mt-1">
            Original currency BDT
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-cohere-hairline">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Average / Entry (BDT)
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-cohere-ink">
            {formatBDT(avgBDT)}
          </div>
          <div className="text-[11px] font-mono text-cohere-slate mt-1">
            Normalized transaction value
          </div>
        </div>
      </div>

      {/* Main Table */}
      <ExpenseTable expenses={expenses} showFilters={false} />
    </div>
  );
}
