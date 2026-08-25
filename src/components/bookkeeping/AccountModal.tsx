'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Account, AccountType } from '@/lib/types';
import { X, BookOpen, AlertCircle } from 'lucide-react';

interface AccountModalProps {
  onClose: () => void;
  parentAccount?: Account | null;
}

export function AccountModal({ onClose, parentAccount }: AccountModalProps) {
  const { addAccount, accounts } = useExpenses();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>(parentAccount ? parentAccount.type : 'asset');
  const [parentId, setParentId] = useState<string>(parentAccount ? parentAccount.id : '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const potentialParents = accounts.filter((a) => a.type === type && !a.parent_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an account name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addAccount({
        code: code.trim() || undefined,
        name: name.trim(),
        type,
        parent_id: parentId || null,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
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
              Chart of Accounts
            </div>
            <h2 className="text-xl font-display font-bold text-cohere-ink tracking-tight">
              {parentAccount ? `Add Sub-Account under ${parentAccount.name}` : 'New Ledger Account'}
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
              Account Code (Optional)
            </label>
            <input
              type="text"
              placeholder="E.g., 1020, 3030, 5110"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-mono text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Account Name *
            </label>
            <input
              type="text"
              required
              placeholder="E.g., Founder Capital — Sarah Jenkins"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Account Classification *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              disabled={!!parentAccount}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100"
            >
              <option value="asset">Asset (Debit balance — Bank, Receivables, Prepaids)</option>
              <option value="liability">Liability (Credit balance — Accounts Payable, Accruals)</option>
              <option value="equity">Equity (Credit balance — Founder Capital, Retained Earnings)</option>
              <option value="income">Income (Credit balance — Founder Contributions, Grants)</option>
              <option value="expense">Expense (Debit balance — Operational Spend)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Parent Account (Optional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">None (Top-Level Account)</option>
              {potentialParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `${p.code} - ` : ''}{p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Description / Usage Note
            </label>
            <textarea
              rows={2}
              placeholder="Operational notes on what posts to this ledger account..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black resize-none"
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
              {isSubmitting ? 'Creating...' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
