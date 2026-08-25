'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { ContributionModal } from '@/components/bookkeeping/ContributionModal';
import { formatBDT } from '@/lib/currency';
import { Coins, Plus, Lock, ArrowUpRight, Shield, User, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function ContributionsPage() {
  const { capitalContributions, profiles, accounts, currentUser, isLoading } = useExpenses();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Loading capital contributions...</p>
      </div>
    );
  }

  const isFinancialUser = currentUser?.role === 'admin' || currentUser?.role === 'accountant';

  if (!isFinancialUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white p-8 rounded-lg border border-cohere-hairline shadow-sm space-y-4">
        <Lock className="w-8 h-8 text-cohere-muted-slate mx-auto" />
        <h2 className="text-xl font-display font-bold text-cohere-ink">Access Restricted</h2>
        <p className="text-xs text-cohere-slate">
          Capital contributions are visible only to company founders, administrators, and certified accountants.
        </p>
        <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-cohere-near-black text-white text-xs font-medium">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const totalContributedBDT = capitalContributions.reduce((sum, c) => {
    const rate = Number(c.exchange_rate) || 122.5;
    const bdt = c.currency === 'USD' ? Number(c.amount) * rate : Number(c.amount);
    return sum + bdt;
  }, 0);

  const founders = profiles.filter((p) => p.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Inward Equity Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
            Founder Capital Contributions
          </h1>
          <p className="text-xs text-cohere-slate mt-0.5">
            Track inward founder infusions powering Rulen remote operations and company runway.
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record Capital Contribution</span>
          </button>
        )}
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-cohere-near-black text-white p-5 rounded-lg border border-black shadow-sm col-span-1 sm:col-span-2">
          <div className="text-[10px] font-mono uppercase text-cohere-soft-coral tracking-wider">
            Total Founder Inward Capital
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-bold mt-1 text-white">
            {formatBDT(totalContributedBDT)}
          </div>
          <p className="text-xs text-gray-300 font-body mt-1">
            Recorded across {capitalContributions.length} contribution tranches, balanced to cash and equity sub-accounts.
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Contributing Founders</div>
          <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
            {founders.length} Active Founders
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-mono text-cohere-slate">
            <Shield className="w-3.5 h-3.5 text-cohere-coral" />
            <span>100% Equity Funded</span>
          </div>
        </div>
      </div>

      {/* Contributions Table */}
      {capitalContributions.length === 0 ? (
        <div className="py-16 text-center bg-white border border-cohere-hairline rounded-lg">
          <Coins className="w-8 h-8 text-cohere-muted-slate mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-cohere-ink font-display">No capital contributions recorded yet</h3>
          <p className="text-xs text-cohere-slate mt-1 max-w-sm mx-auto">
            {currentUser?.role === 'admin'
              ? 'Click "Record Capital Contribution" to deposit founder capital into the company ledger.'
              : 'No founder capital contributions have been posted yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-cohere-hairline rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cohere-hairline bg-cohere-soft-stone/40 text-[10px] font-mono uppercase text-cohere-slate tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Contributing Founder</th>
                <th className="py-3 px-4">Equity Sub-Account</th>
                <th className="py-3 px-4">Method & Note</th>
                <th className="py-3 px-4 text-right">Amount (Original)</th>
                <th className="py-3 px-4 text-right">Value (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cohere-hairline font-body">
              {capitalContributions.map((c) => {
                const contributor = profiles.find((p) => p.id === c.contributed_by);
                const equityAccount = accounts.find((a) => a.id === c.founder_account_id);
                const rate = Number(c.exchange_rate) || 122.5;
                const amountBDT = c.currency === 'USD' ? Number(c.amount) * rate : Number(c.amount);

                return (
                  <tr key={c.id} className="hover:bg-cohere-soft-stone/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-cohere-ink">
                      {c.contribution_date}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            contributor?.avatar_url ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${contributor?.name || 'Founder'}`
                          }
                          alt="avatar"
                          className="w-6 h-6 rounded-full object-cover border border-cohere-hairline"
                        />
                        <div>
                          <div className="font-semibold text-cohere-ink">{contributor?.name || 'Founder'}</div>
                          <div className="text-[10px] font-mono text-cohere-muted-slate">{contributor?.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-cohere-slate">
                      {equityAccount?.name || 'Founder Capital (3010)'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="capitalize font-medium text-cohere-ink">
                        {c.method.replace(/_/g, ' ')}
                      </div>
                      {c.note && (
                        <div className="text-[11px] text-cohere-muted-slate truncate max-w-xs">{c.note}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-cohere-slate">
                      {c.currency === 'USD' ? `$${Number(c.amount).toFixed(2)}` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-cohere-ink text-sm">
                      {formatBDT(amountBDT)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && <ContributionModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
