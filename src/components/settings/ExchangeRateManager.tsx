'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Coins, Check, RefreshCw } from 'lucide-react';
import { formatBDT } from '@/lib/currency';

export function ExchangeRateManager() {
  const { settings, updateExchangeRate } = useExpenses();
  const [rateInput, setRateInput] = useState<string>(String(settings.default_exchange_rate));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(rateInput);
    if (val > 0) {
      updateExchangeRate(val);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-cohere-hairline p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Currency & Conversions
          </div>
          <h3 className="text-base font-semibold text-cohere-ink font-display flex items-center gap-2">
            <Coins className="w-4 h-4 text-cohere-slate" /> Default Exchange Rate
          </h3>
          <p className="text-xs text-cohere-slate mt-0.5">
            Admin-controlled baseline exchange rate for pre-filling new USD expense logs and aggregating company spend in BDT.
          </p>
        </div>
        <div className="px-2.5 py-1 rounded bg-cohere-soft-stone text-xs font-mono text-cohere-ink">
          Base: <strong>BDT (৳)</strong>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-5 space-y-4">
        <div className="p-4 rounded-md bg-cohere-soft-stone/60 border border-cohere-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-cohere-slate mb-1">
              1 US Dollar (USD) equals
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="1"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                required
                className="w-36 px-3 py-2 rounded-sm border border-cohere-border-light text-base font-mono font-bold text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
              <span className="font-mono text-xs font-bold text-cohere-ink">BDT (৳)</span>
            </div>
          </div>

          <div className="text-xs text-cohere-slate font-mono space-y-0.5">
            <div>Current Active System Rate: <strong>{settings.default_exchange_rate.toFixed(2)} BDT</strong></div>
            <div className="text-[11px] text-cohere-muted-slate">Example: $1,000 USD = {formatBDT(1000 * settings.default_exchange_rate)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-cohere-muted-slate font-body">
            Note: Updating this rate will pre-fill all upcoming expense entries. Historic entries retain their captured rate.
          </p>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs text-cohere-deep-green font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Rate updated!
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium font-body transition-colors"
            >
              Update Default Rate
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
