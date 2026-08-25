'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Currency, RecurringFrequency } from '@/lib/types';
import { X, RotateCw, AlertCircle } from 'lucide-react';

interface RecurringModalProps {
  onClose: () => void;
}

export function RecurringModal({ onClose }: RecurringModalProps) {
  const { categories, settings, addRecurringItem } = useExpenses();

  const [name, setName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !vendorName.trim()) {
      setError('Please provide a name and vendor.');
      return;
    }
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addRecurringItem({
        name: name.trim(),
        vendor_name: vendorName.trim(),
        category_id: categoryId,
        amount: numAmount,
        currency,
        frequency,
        next_due_date: nextDueDate,
        exchange_rate: currency === 'USD' ? settings.default_exchange_rate : 1,
        is_active: true,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save recurring subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-lg border border-cohere-hairline shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-cohere-hairline">
          <div>
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              Subscription Management
            </div>
            <h2 className="text-xl font-display font-bold text-cohere-ink tracking-tight">
              Add Recurring Contract
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-cohere-slate hover:text-cohere-ink hover:bg-cohere-soft-stone transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Subscription / Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="E.g., Vercel Pro Team, Supabase Pro Plan, Claude Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Vendor / Provider *
            </label>
            <input
              type="text"
              required
              placeholder="E.g., Vercel Inc., Anthropic, Google Cloud"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Billing Cadence *
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-cohere-slate">
              Cost & Currency *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-mono font-bold text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
              />
              <div className="flex p-0.5 bg-cohere-soft-stone rounded-sm border border-cohere-card-border">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold ${
                    currency === 'USD' ? 'bg-white text-cohere-ink shadow-xs' : 'text-cohere-slate'
                  }`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('BDT')}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold ${
                    currency === 'BDT' ? 'bg-white text-cohere-ink shadow-xs' : 'text-cohere-slate'
                  }`}
                >
                  BDT
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Next Renewal / Due Date *
            </label>
            <input
              type="date"
              required
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-cohere-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-pill text-xs font-medium text-cohere-slate hover:text-cohere-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
