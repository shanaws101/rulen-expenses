'use client';

import React, { useState, useMemo } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { RecurringModal } from '@/components/recurring/RecurringModal';
import { formatBDT } from '@/lib/currency';
import {
  RotateCw,
  Plus,
  Calendar,
  Layers,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Clock,
  Coins,
} from 'lucide-react';

export default function RenewalsPage() {
  const { recurringItems, categories, updateRecurringItem, deleteRecurringItem, currentUser, isLoading } = useExpenses();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Loading recurring contracts...</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  // Sort by next_due_date
  const sortedItems = useMemo(() => {
    return [...recurringItems].sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
  }, [recurringItems]);

  const monthlyCommittedBDT = recurringItems.filter((i) => i.is_active).reduce((sum, item) => {
    const rate = Number(item.exchange_rate) || 122.5;
    const bdt = item.currency === 'USD' ? Number(item.amount) * rate : Number(item.amount);
    if (item.frequency === 'monthly') return sum + bdt;
    if (item.frequency === 'quarterly') return sum + bdt / 3;
    if (item.frequency === 'annual') return sum + bdt / 12;
    return sum + bdt;
  }, 0);

  const annualCommittedBDT = monthlyCommittedBDT * 12;

  const isFinancialUser = currentUser?.role === 'admin' || currentUser?.role === 'accountant';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            SaaS & Infrastructure Commitments
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
            Upcoming Renewals & Subscriptions
          </h1>
          <p className="text-xs text-cohere-slate mt-0.5">
            Active cloud compute, development tooling, domain registrations, and SaaS renewals feeding into financial forecasts.
          </p>
        </div>

        {isFinancialUser && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subscription</span>
          </button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Monthly Recurring Run-Rate</div>
          <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
            {formatBDT(monthlyCommittedBDT)}
          </div>
          <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
            Normalized monthly SaaS & Hosting commitments
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Annual Contracted Value</div>
          <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
            {formatBDT(annualCommittedBDT)}
          </div>
          <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
            Projected 12-month recurring expenditure
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Active Contracts</div>
          <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
            {recurringItems.filter((i) => i.is_active).length} of {recurringItems.length}
          </div>
          <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
            Supplying forecasting engine
          </div>
        </div>
      </div>

      {/* Table */}
      {sortedItems.length === 0 ? (
        <div className="py-16 text-center bg-white border border-cohere-hairline rounded-lg">
          <RotateCw className="w-8 h-8 text-cohere-muted-slate mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-cohere-ink font-display">No recurring contracts tracked</h3>
          <p className="text-xs text-cohere-slate mt-1 max-w-sm mx-auto">
            Add recurring subscriptions like Vercel, OpenAI API, GitHub, or domain renewals.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-cohere-hairline rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cohere-hairline bg-cohere-soft-stone/40 text-[10px] font-mono uppercase text-cohere-slate tracking-wider">
                <th className="py-3 px-4">Subscription & Vendor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Billing Cadence</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4 text-right">Cost (Original)</th>
                <th className="py-3 px-4 text-right">Cost (BDT)</th>
                {isFinancialUser && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-cohere-hairline font-body">
              {sortedItems.map((item) => {
                const category = categories.find((c) => c.id === item.category_id);
                const rate = Number(item.exchange_rate) || 122.5;
                const amountBDT = item.currency === 'USD' ? Number(item.amount) * rate : Number(item.amount);
                const isDueSoon = item.next_due_date <= today;

                return (
                  <tr key={item.id} className="hover:bg-cohere-soft-stone/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-cohere-ink">{item.name}</div>
                      <div className="text-[10px] font-mono text-cohere-muted-slate">{item.vendor_name}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cohere-soft-stone text-cohere-ink">
                        {category?.name || 'Operational'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono uppercase text-[11px] text-cohere-slate">
                      {item.frequency}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                          isDueSoon ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-cohere-ink'
                        }`}
                      >
                        <Clock className="w-3 h-3 text-cohere-slate" /> {item.next_due_date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-cohere-slate">
                      {item.currency === 'USD' ? `$${Number(item.amount).toFixed(2)}` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-cohere-ink text-sm">
                      {formatBDT(amountBDT)}
                    </td>

                    {isFinancialUser && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => deleteRecurringItem(item.id)}
                          className="p-1 text-cohere-slate hover:text-red-600 transition-colors"
                          title="Delete Contract"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && <RecurringModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
