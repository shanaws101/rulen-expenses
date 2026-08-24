'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Budget, Currency } from '@/lib/types';
import { convertToBDT, formatBDT } from '@/lib/currency';
import { X, AlertCircle } from 'lucide-react';

interface BudgetModalProps {
  onClose: () => void;
  editingBudget?: Budget | null;
}

export function BudgetModal({ onClose, editingBudget }: BudgetModalProps) {
  const { categories, settings, saveBudget } = useExpenses();
  const activeCategories = categories.filter((c) => c.is_active);

  const [categoryId, setCategoryId] = useState<string>(
    editingBudget ? editingBudget.category_id : activeCategories[0]?.id || ''
  );
  const [limitAmount, setLimitAmount] = useState<string>(
    editingBudget ? String(editingBudget.limit_amount) : ''
  );
  const [limitCurrency, setLimitCurrency] = useState<Currency>(
    editingBudget ? editingBudget.limit_currency : 'USD'
  );
  const [period, setPeriod] = useState<'month' | 'year'>(
    editingBudget ? editingBudget.period : 'month'
  );
  const [monthYear, setMonthYear] = useState<string>(
    editingBudget ? editingBudget.month_year : new Date().toISOString().substring(0, 7)
  );
  const [error, setError] = useState<string | null>(null);

  const numericAmount = parseFloat(limitAmount) || 0;
  const convertedBDT = convertToBDT(numericAmount, limitCurrency, settings.default_exchange_rate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!limitAmount || numericAmount <= 0) {
      setError('Please provide a valid budget limit amount greater than 0.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category for this budget.');
      return;
    }

    try {
      saveBudget({
        id: editingBudget ? editingBudget.id : undefined,
        category_id: categoryId,
        period,
        month_year: monthYear,
        limit_amount: numericAmount,
        limit_currency: limitCurrency,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget limit.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-lg border border-cohere-hairline shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between pb-4 border-b border-cohere-hairline">
          <div>
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              {editingBudget ? 'Update Budget' : 'Configure New Budget'}
            </div>
            <h3 className="text-base font-display font-bold text-cohere-ink">
              {editingBudget ? 'Edit Category Budget Limit' : 'Set Category Budget Limit'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-cohere-slate hover:text-cohere-ink hover:bg-cohere-soft-stone"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-cohere-slate mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!editingBudget}
              required
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-cohere-slate mb-1">
              Limit Amount & Currency *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="1"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="500.00"
                required
                className="flex-1 px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-mono font-bold text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
              />
              <div className="flex rounded p-0.5 bg-cohere-soft-stone border border-cohere-card-border">
                <button
                  type="button"
                  onClick={() => setLimitCurrency('USD')}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold ${
                    limitCurrency === 'USD' ? 'bg-white shadow-sm text-cohere-ink' : 'text-cohere-slate'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setLimitCurrency('BDT')}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold ${
                    limitCurrency === 'BDT' ? 'bg-white shadow-sm text-cohere-ink' : 'text-cohere-slate'
                  }`}
                >
                  BDT (৳)
                </button>
              </div>
            </div>

            {limitCurrency === 'USD' && (
              <div className="mt-2 text-[11px] font-mono text-cohere-deep-green">
                ≈ {formatBDT(convertedBDT)} (Calculated at current default rate: {settings.default_exchange_rate} BDT)
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-cohere-slate mb-1">
                Period *
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'month' | 'year')}
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="month">Monthly</option>
                <option value="year">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-cohere-slate mb-1">
                Target Month / Year *
              </label>
              <input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-mono text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-cohere-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-pill text-xs text-cohere-slate hover:text-cohere-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium"
            >
              {editingBudget ? 'Update Budget' : 'Save Budget Limit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
