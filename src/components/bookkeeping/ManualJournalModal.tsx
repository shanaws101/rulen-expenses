'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Currency } from '@/lib/types';
import { verifyJournalBalance } from '@/lib/accounting';
import { formatBDT } from '@/lib/currency';
import { X, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ManualJournalModalProps {
  onClose: () => void;
}

interface LineState {
  account_id: string;
  debit_amount: string;
  credit_amount: string;
  currency: Currency;
}

export function ManualJournalModal({ onClose }: ManualJournalModalProps) {
  const { accounts, settings, addJournalEntry } = useExpenses();

  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [settledDate, setSettledDate] = useState('');
  const [hasSettledDate, setHasSettledDate] = useState(false);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<LineState[]>([
    { account_id: accounts[0]?.id || '', debit_amount: '', credit_amount: '', currency: 'BDT' },
    { account_id: accounts[1]?.id || '', debit_amount: '', credit_amount: '', currency: 'BDT' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rate = settings.default_exchange_rate || 122.5;

  // Calculate Debits and Credits in BDT
  const computedLines = lines.map((l) => {
    const deb = parseFloat(l.debit_amount) || 0;
    const cred = parseFloat(l.credit_amount) || 0;
    const debBDT = l.currency === 'USD' ? deb * rate : deb;
    const credBDT = l.currency === 'USD' ? cred * rate : cred;
    return {
      account_id: l.account_id,
      debit_amount: deb,
      credit_amount: cred,
      currency: l.currency,
      exchange_rate: rate,
      debit_bdt: debBDT,
      credit_bdt: credBDT,
    };
  });

  const balanceCheck = verifyJournalBalance(computedLines);

  const handleAddLine = () => {
    setLines([
      ...lines,
      { account_id: accounts[0]?.id || '', debit_amount: '', credit_amount: '', currency: 'BDT' },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleUpdateLine = (index: number, field: keyof LineState, value: any) => {
    setLines(
      lines.map((l, i) => {
        if (i !== index) return l;
        // If entering debit, clear credit and vice versa
        if (field === 'debit_amount' && value) {
          return { ...l, debit_amount: value, credit_amount: '' };
        }
        if (field === 'credit_amount' && value) {
          return { ...l, credit_amount: value, debit_amount: '' };
        }
        return { ...l, [field]: value };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Please provide a memo/description for this journal entry.');
      return;
    }

    if (!balanceCheck.isBalanced) {
      setError(
        `Journal entry does not balance! Total Debits: ${formatBDT(
          balanceCheck.totalDebits
        )}, Total Credits: ${formatBDT(balanceCheck.totalCredits)} (Difference: ${formatBDT(
          balanceCheck.diff
        )}).`
      );
      return;
    }

    // Filter out zero lines
    const validLines = computedLines.filter((l) => l.debit_bdt > 0 || l.credit_bdt > 0);
    if (validLines.length < 2) {
      setError('A journal entry must have at least one debit line and one credit line.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addJournalEntry({
        entry_date: entryDate,
        settled_date: hasSettledDate && settledDate ? settledDate : null,
        description: description.trim(),
        source_type: 'manual',
        lines: validLines,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post journal entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-lg border border-cohere-hairline shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-cohere-hairline">
          <div>
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              General Ledger Post
            </div>
            <h2 className="text-xl font-display font-bold text-cohere-ink tracking-tight">
              Post Manual Journal Entry
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-cohere-slate hover:text-cohere-ink hover:bg-cohere-soft-stone transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Dates & Memo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Entry Date (Accrual Basis) *
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono uppercase text-cohere-slate">
                  Settled Date (Cash Basis)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-cohere-slate cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSettledDate}
                    onChange={(e) => setHasSettledDate(e.target.checked)}
                    className="rounded text-black focus:ring-0"
                  />
                  <span>Cash Settled</span>
                </label>
              </div>
              <input
                type="date"
                disabled={!hasSettledDate}
                value={settledDate}
                onChange={(e) => setSettledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Description / Business Memo *
            </label>
            <input
              type="text"
              required
              placeholder="E.g., Bank fee adjustment, Prepaid subscription amortization, Founder capital adjustment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Lines Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-mono uppercase text-cohere-slate">
                Debit & Credit Postings (Double-Entry)
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-cohere-action-blue hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>

            <div className="border border-cohere-hairline rounded-md overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-cohere-soft-stone/50 border-b border-cohere-hairline text-[10px] font-mono uppercase text-cohere-slate">
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3 w-24">Currency</th>
                    <th className="py-2.5 px-3 w-32 text-right">Debit</th>
                    <th className="py-2.5 px-3 w-32 text-right">Credit</th>
                    <th className="py-2.5 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cohere-hairline">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-cohere-soft-stone/20">
                      <td className="p-2">
                        <select
                          value={line.account_id}
                          onChange={(e) => handleUpdateLine(idx, 'account_id', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code ? `${a.code} - ` : ''}{a.name} ({a.type.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2">
                        <select
                          value={line.currency}
                          onChange={(e) => handleUpdateLine(idx, 'currency', e.target.value as Currency)}
                          className="w-full px-2 py-1.5 rounded-sm border border-cohere-border-light text-xs font-mono font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          <option value="BDT">BDT (৳)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.debit_amount}
                          onChange={(e) => handleUpdateLine(idx, 'debit_amount', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-sm border border-cohere-border-light text-xs font-mono text-right text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.credit_amount}
                          onChange={(e) => handleUpdateLine(idx, 'credit_amount', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-sm border border-cohere-border-light text-xs font-mono text-right text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          disabled={lines.length <= 2}
                          onClick={() => handleRemoveLine(idx)}
                          className="text-cohere-slate hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-cohere-soft-stone/70 border-t border-cohere-hairline font-mono font-bold text-xs">
                    <td className="py-2.5 px-3" colSpan={2}>
                      Total Converted (BDT Base)
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {formatBDT(balanceCheck.totalDebits)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {formatBDT(balanceCheck.totalCredits)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Balancing Status Badge */}
            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                {balanceCheck.isBalanced ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Balanced (Debits = Credits)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5" /> Out of Balance by {formatBDT(balanceCheck.diff)}
                  </span>
                )}
              </div>
              <span className="text-cohere-muted-slate text-[11px]">
                Exchange Rate: 1 USD = {rate.toFixed(2)} BDT
              </span>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-cohere-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-pill text-xs font-medium text-cohere-slate hover:text-cohere-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !balanceCheck.isBalanced}
              className="px-6 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post Journal Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
