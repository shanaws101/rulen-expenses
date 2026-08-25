'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { ContributionMethod, Currency } from '@/lib/types';
import { convertToBDT, formatBDT } from '@/lib/currency';
import { X, Coins, CheckCircle2, AlertCircle } from 'lucide-react';

interface ContributionModalProps {
  onClose: () => void;
}

export function ContributionModal({ onClose }: ContributionModalProps) {
  const { profiles, accounts, settings, addCapitalContribution, currentUser } = useExpenses();

  const founders = profiles.filter((p) => p.role === 'admin');
  const founderEquityAccounts = accounts.filter((a) => a.type === 'equity');

  const [founderId, setFounderId] = useState<string>(
    founders[0]?.id || currentUser?.id || ''
  );
  const [founderAccountId, setFounderAccountId] = useState<string>(
    founderEquityAccounts.find((a) => a.code === '3010')?.id || founderEquityAccounts[0]?.id || ''
  );
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('BDT');
  const [exchangeRate, setExchangeRate] = useState(String(settings.default_exchange_rate));
  const [contributionDate, setContributionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [method, setMethod] = useState<ContributionMethod>('bank_transfer');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const numRate = parseFloat(exchangeRate) || settings.default_exchange_rate;
  const convertedBDT = convertToBDT(numAmount, currency, numRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || numAmount <= 0) {
      setError('Please enter a valid contribution amount greater than 0.');
      return;
    }
    if (!founderId) {
      setError('Please select a founder.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addCapitalContribution({
        contributed_by: founderId,
        founder_account_id: founderAccountId || undefined,
        amount: numAmount,
        currency,
        exchange_rate: numRate,
        contribution_date: contributionDate,
        settled_date: contributionDate,
        method,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record capital contribution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-lg border border-cohere-hairline shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-cohere-hairline">
          <div>
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              Equity & Inward Funding
            </div>
            <h2 className="text-xl font-display font-bold text-cohere-ink tracking-tight">
              Record Founder Capital Contribution
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

          {/* Contributing Founder */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Contributing Founder *
            </label>
            <select
              required
              value={founderId}
              onChange={(e) => setFounderId(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              {founders.length > 0 ? (
                founders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.email})
                  </option>
                ))
              ) : currentUser ? (
                <option value={currentUser.id}>{currentUser.name} ({currentUser.email})</option>
              ) : (
                <option value="">No founder profile found</option>
              )}
            </select>
          </div>

          {/* Equity Sub-Account */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Target Founder Capital Sub-Account *
            </label>
            <select
              value={founderAccountId}
              onChange={(e) => setFounderAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              {founderEquityAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code ? `${acc.code} - ` : ''}{acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Currency */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase text-cohere-slate">
              Contribution Amount & Currency *
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
                className="w-full px-3.5 py-2.5 rounded-sm border border-cohere-border-light text-base font-mono font-bold text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
              />

              <div className="flex p-1 bg-cohere-soft-stone rounded-sm border border-cohere-card-border">
                <button
                  type="button"
                  onClick={() => setCurrency('BDT')}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                    currency === 'BDT'
                      ? 'bg-white text-cohere-ink shadow-sm'
                      : 'text-cohere-slate hover:text-cohere-ink'
                  }`}
                >
                  BDT (৳)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                    currency === 'USD'
                      ? 'bg-white text-cohere-ink shadow-sm'
                      : 'text-cohere-slate hover:text-cohere-ink'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {currency === 'USD' && (
              <div className="text-xs font-mono text-cohere-slate pt-1">
                Converted Value: <strong className="text-cohere-black">{formatBDT(convertedBDT)}</strong>
              </div>
            )}
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Contribution Date *
              </label>
              <input
                type="date"
                required
                value={contributionDate}
                onChange={(e) => setContributionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Deposit Method *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as ContributionMethod)}
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="bank_transfer">Bank Wire / Transfer</option>
                <option value="cash">Cash Infusion</option>
                <option value="other">Other Digital Transfer</option>
              </select>
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Note / Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="E.g., Q3 runway infusion, Initial founder capital deposit..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="p-3 bg-cohere-soft-stone/50 rounded text-[11px] font-mono text-cohere-slate">
            Auto-posts to General Ledger: <strong>Debit Cash / Bank</strong> (+Asset) & <strong>Credit Founder Capital</strong> (+Equity).
          </div>

          {/* Submit */}
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
              className="px-5 py-2.5 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Recording...' : 'Record Capital Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
